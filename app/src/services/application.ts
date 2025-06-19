import constants from "../config/constants/constants";
import { logger } from "../logging";
import Response from "../models/response";
import { generateError, generateRandomString } from "../services/util";
import ApplicationRepository, {
  ApplicationData as RepoApplicationData,
  GetApplicationDataDBResponse,
} from "../repositories/application";
import userRepositoryFactory, {
  GetUserDataDBResponse,
} from "../repositories/user";

import passengerRepositoryFactory, {
  PassengerData as RepoPassengerData,
  GetPassengerDataDBResponse,
} from "../repositories/passenger";
import applicationPassengerRepositoryFactory, {
  ApplicationPassengerMappingData,
  GetApplicationPassengerMappingDataDBResponse,
} from "../repositories/applicationPassengerMapping";
import visaRequestRepositoryFactory, {
  VisaRequestData,
} from "../repositories/visaRequest";
import applicationVisaRequestMappingRepositoryFactory from "../repositories/applicationVisaRequestMapping";
import { AddStep1DataRequest } from "../models/Application/addStep1DataRequest";
import { AddStep2DataRequest } from "../models/Application/addStep2DataRequest";
import { AddStep3DataRequest, PersonalInfo, PassportInfo, AddressInfo } from "../models/Application/addStep3DataRequest";
import { AddStep4DataRequest } from "../models/Application/addStep4DataRequest";
import { SearchPaxRequest } from "../models/Application/searchPax";
import { SearchRequest } from "../models/Application/tracker";
import MySql from "../database/mySql";
import ResponseModel from "../models/response";
import { APPLICATION_QUEUES, APPLICATION_EXTERNAL_STATUS } from "../config/applicationStatus";
import ClientRepository from "../repositories/client";

const applicationService = () => {
  const applicationRepository = ApplicationRepository();
  const userRepository = userRepositoryFactory();
  const passengerRepository = passengerRepositoryFactory();
  const applicationPassengerRepository = applicationPassengerRepositoryFactory();
  const visaRequestRepository = visaRequestRepositoryFactory();
  const clientRepository = ClientRepository();
  const applicationVisaRequestMappingRepository = applicationVisaRequestMappingRepositoryFactory();

  //Done
  const addStep1Data = async (request: AddStep1DataRequest): Promise<any> => {
    const response = new Response(false);
    try {
      /// Client User verifications
      // Fetch user info using email
      const userResponse: GetUserDataDBResponse | null =
        await userRepository.getByID(request.client_user_id);

      // Error Fetching userInfo
      if (!userResponse || !userResponse.status) {
        throw new Error("Unable to fetch user info");
      }

      // User with this email already exists
      if ((userResponse?.data || []).length == 0) {
        response.setMessage(
          `Invalid Client User ID: ${request.client_user_id}`
        );
        return response;
      }

      // client status check
      if (userResponse?.data?.[0]?.status !== constants.STATUS.USER.ACTIVE) {
        response.setMessage(`Client currently inactive`);
        return response;
      }

      request.status = constants.STATUS.APPLICATION.STEP1_DONE;
      request.reference_number =
        generateRandomString(3, "alpha") + generateRandomString(4, "num");
      // Create Application
      const resp: any = await applicationRepository.insertAddStep1Data(request);
      if (!resp.status) {
        throw new Error("Unable to create application");
      }

      response.setStatus(true);
      response.data = {
        "application_id": resp.data?.insertId,
        "reference_number": request.reference_number,
      }
      return response;
    } catch (e) {
      logger.error(
        `error in applicationService.addStep1Data - ${generateError(e)}`
      );
      throw e;
    }
  };

  //Done
  const addStep2Data = async (request: AddStep2DataRequest): Promise<any> => {
    const response = new Response(false);
    try {
      /// Fetch passenger data
      const passengerResponse: GetPassengerDataDBResponse =
        await passengerRepository.getByPassengerIds([request.pax_id]);

      // Error Fetching passengerInfo
      if (!passengerResponse || !passengerResponse.status) {
        throw new Error(
          `unable to fetch passenger info by pax_id: ${request.pax_id}`
        );
      }

      const passengerInfo: RepoPassengerData | null = passengerResponse.data
        ? passengerResponse.data[0]
        : null;
      if (passengerInfo == null) {
        response.setMessage(`Invalid Passenger ID: ${request.pax_id}`);
        return response;
      }

      /// Fetch Application data
      const applicationResponse: GetApplicationDataDBResponse =
        await applicationRepository.getById(
          request.application_id
        );

      // Error Fetching passengerInfo
      if (!applicationResponse || !applicationResponse.status) {
        throw new Error(
          `unable to fetch application info by reference_number: ${request.application_id}`
        );
      }

      const applicationInfo: RepoApplicationData | null = applicationResponse.data
        ? applicationResponse.data[0]
        : null;
      if (applicationInfo == null) {
        response.setMessage(
          `Invalid application_id: ${request.application_id}`
        );
        return response;
      }

      // TODO: Add this once the status check is done in the frontend
      // if (applicationInfo.status !== constants.STATUS.APPLICATION.STEP1_DONE) {
      //   response.setMessage(`Application with ID: ${request.reference_number} is currently on wrong status: ${applicationInfo.status}`);
      //   return response;
      // }

      // create application passenger mapping
      const insertResponse: any = await applicationPassengerRepository.insert({
        application_id: applicationInfo.id,
        passenger_id: request.pax_id,
        status: constants.STATUS.APPLICATION_PASSENGER_MAPPING.ACTIVE,
        last_updated_by: request.last_updated_by,
      });
      if (!insertResponse.status) {
        throw new Error("Unable to insert application passenger mapping");
      }

      // update application status
      const updateResponse: any = await applicationRepository.updateStatus(
        constants.STATUS.APPLICATION_PASSENGER_MAPPING.ACTIVE,
        applicationInfo.id || 0,
        request.last_updated_by
      );
      if (!updateResponse.status) {
        throw new Error("Unable to update application status");
      }

      response.setStatus(true);
      return response;
    } catch (e) {
      logger.error(
        `error in applicationService.addStep1Data - ${generateError(e)}`
      );
      throw e;
    }
  };

  //Done
  const searchPax = async (request: SearchPaxRequest): Promise<any> => {
    const response = new Response(false);
    try {
      let passengerIds: number[] = [];
      if (request.reference_number.length > 0) {
        const applicationResponse: GetApplicationDataDBResponse =
          await applicationRepository.searchSubmittedApplicationsByReferenceNumber(
            request.reference_number,
            constants.STATUS.APPLICATION.STEP4_DONE
          );

        // Error Fetching applicationResponse
        if (!applicationResponse || !applicationResponse.status) {
          throw new Error(
            `unable to fetch application info by reference_number: ${request.reference_number}`
          );
        }

        const applicationsInfo: RepoApplicationData[] = applicationResponse.data
          ? applicationResponse.data
          : [];
        if (applicationsInfo.length > 0) {
          const applicationids: number[] = applicationsInfo
            .map((app) => app.id)
            .filter((id): id is number => id !== undefined);

          const mappingResponse: GetApplicationPassengerMappingDataDBResponse =
            await applicationPassengerRepository.getByApplicationIds(
              applicationids,
              [constants.STATUS.APPLICATION_PASSENGER_MAPPING.ACTIVE]
            );

          // Error Fetching applicationResponse
          if (!mappingResponse || !mappingResponse.status) {
            throw new Error(
              `unable to fetch mapping info by application ids: ${applicationids}`
            );
          }
          const mappingInfo: ApplicationPassengerMappingData[] =
            mappingResponse.data ? mappingResponse.data : [];

          passengerIds = mappingInfo
            .map((app) => app.passenger_id)
            .filter((id): id is number => id !== undefined);
        }
      }

      // if reference number present, fetch related passenger id
      // add pax_name and passport_number as or if present
      const passengerResponse: GetPassengerDataDBResponse =
        await passengerRepository.search(
          passengerIds,
          request.pax_name,
          request.passport_number
        );

      // Error Fetching applicationResponse
      if (!passengerResponse || !passengerResponse.status) {
        throw new Error(
          `unable to fetch passenger info by passengerIds: ${passengerIds}, request.pax_name: ${request.pax_name}, request.passport_number: ${request.passport_number}`
        );
      }
      const mappingInfo: RepoPassengerData[] = passengerResponse.data
        ? passengerResponse.data
        : [];

      response.setStatus(true);
      response.setData("passengers_info", mappingInfo);
      return response;
    } catch (e) {
      logger.error(
        `error in applicationService.searchPax - ${generateError(e)}`
      );
      throw e;
    }
  };

  //Done
  const addStep4Data = async (request: AddStep4DataRequest): Promise<any> => {
    const response = new Response(false);
    try {
      /// Fetch Application data
      const applicationResponse: GetApplicationDataDBResponse =
        await applicationRepository.getByReferenceNumber(
          request.reference_number
        );

      // Error Fetching passengerInfo
      if (!applicationResponse || !applicationResponse.status) {
        throw new Error(
          `unable to fetch application info by reference_number: ${request.reference_number}`
        );
      }

      const applicationInfo: RepoApplicationData | null = applicationResponse.data
        ? applicationResponse.data[0]
        : null;
      if (applicationInfo == null) {
        response.setMessage(
          `Invalid application reference_number: ${request.reference_number}`
        );
        return response;
      }

      // if (applicationInfo.status !== constants.STATUS.APPLICATION.STEP1_DONE) {
      //   response.setMessage(`Application with ID: ${request.reference_number} is currently on wrong status: ${applicationInfo.status}`);
      //   return response;
      // }

      // update application status and details
      const updateResponse: any = await applicationRepository.updateStep4Data(
        request,
        applicationInfo.id || 0
      );
      if (!updateResponse.status) {
        throw new Error("Unable to update application status");
      }

      response.setStatus(true);
      return response;
    } catch (e) {
      logger.error(
        `error in applicationService.addStep4Data - ${generateError(e)}`
      );
      throw e;
    }
  };

  const search = async (request: SearchRequest): Promise<any> => {
    const response = new Response(false);
    try {
      logger.info(`Searching applications with filters - ${generateError(request)}`);
      
      // Convert request to search parameters
      const searchParams = {
        reference_number: request.reference_number || '',
        customer_type: request.customer_type || 0,
        client_user_id: request.customer || 0, // Use customer from SearchRequest
        name: request.name || '',
        passport_number: '', // Not present in SearchRequest, use empty string
        visa_branch: request.visa_branch || 0,
        entry_generation_branch: request.entry_generation_branch || 0,
        from_date: request.from_date || '',
        to_date: request.to_date || '',
        queue: request.queue || 0,
        status: request.status || 0,
        country: request.country || 0,
        billing_to_company: request.billing_to_company || ''
      };

      const queryStartTime = Date.now();
      const searchResult = await applicationRepository.searchApplications(searchParams);
      const queryEndTime = Date.now();
      logger.info(`Repository searchApplications completed in ${queryEndTime - queryStartTime}ms with ${searchResult.data?.length || 0} results`);
      
      if (!searchResult.status) {
        response.setMessage("Failed to search applications");
        return response;
      }
      response.setStatus(true);
      response.data = { applications: searchResult.data };
      return response;
      
      // // Fetch client and passenger details for each application
      // const applications = searchResult.data;
      
      // // Define an interface for enriched applications to avoid implicit any[]
      // interface EnrichedApplication extends RepoApplicationData {
      //   passenger: {
      //     id: number;
      //     first_name: string;
      //     last_name: string;
      //     full_name: string;
      //     email: string;
      //     passport_number: string;
      //     processing_branch: number;
      //   } | null;
      //   client: {
      //     id: number;
      //     name: string;
      //     type: number;
      //   } | null;
      // }
      
      // const enrichedApplications: EnrichedApplication[] = [];
      
      // // Get unique client user IDs
      // const clientUserIds = [...new Set(applications.map(app => app.client_user_id).filter(Boolean))];
      
      // // Get client data for all client user IDs in one query
      // const clientsData: Map<number, any> = new Map();
      // if (clientUserIds.length > 0) {
      //   const clientsResult = await Promise.all(
      //     clientUserIds.map(userId => clientRepository.getByUserId(userId))
      //   );
        
      //   clientsResult.forEach(result => {
      //     if (result.status && result.data && result.data.length > 0) {
      //       const client = result.data[0];
      //       clientsData.set(client.user_id, client);
      //     }
      //   });
      // }
      
      // // Get application IDs and fetch passengers
      // const applicationIds = applications.map(app => app.id).filter(Boolean) as number[];
      
      // // Get passengers for all applications
      // let passengersMap: Map<number, RepoPassengerData> = new Map();
      // if (applicationIds.length > 0) {
      //   // Get mappings
      //   const mappingsResult = await applicationPassengerRepository.getByApplicationIds(
      //     applicationIds, 
      //     [constants.STATUS.APPLICATION_PASSENGER_MAPPING.ACTIVE]
      //   );
        
      //   if (mappingsResult.status && mappingsResult.data && mappingsResult.data.length > 0) {
      //     // Get unique passenger IDs
      //     const passengerIds = [...new Set(
      //       mappingsResult.data
      //         .map(mapping => mapping.passenger_id)
      //         .filter(Boolean)
      //     )] as number[];
          
      //     // Get passenger data
      //     const passengersResult = await passengerRepository.getByPassengerIds(passengerIds);
          
      //     if (passengersResult.status && passengersResult.data) {
      //       // Create passenger map by ID
      //       passengersResult.data.forEach(passenger => {
      //         if (passenger.id) {
      //           passengersMap.set(passenger.id, passenger);
      //         }
      //       });
            
      //       // Create application to passenger map
      //       mappingsResult.data.forEach(mapping => {
      //         if (mapping.application_id && mapping.passenger_id) {
      //           // Retrieve the passenger data from the map
      //           const passengerId = mapping.passenger_id;
      //           const passenger = passengersMap.get(passengerId);
                
      //           if (!passenger) return;
                
      //           // Enrich applications with passenger and client data
      //           const application = applications.find(app => app.id === mapping.application_id);
      //           if (application) {
      //             const clientData = clientsData.get(application.client_user_id);
                  
      //             enrichedApplications.push({
      //               ...application,
      //               passenger: {
      //                 id: passenger.id || 0,
      //                 first_name: passenger.first_name,
      //                 last_name: passenger.last_name,
      //                 full_name: `${passenger.first_name} ${passenger.last_name}`,
      //                 email: passenger.email,
      //                 passport_number: passenger.passport_number,
      //                 processing_branch: passenger.processing_branch
      //               },
      //               client: clientData ? {
      //                 id: clientData.id,
      //                 name: clientData.name,
      //                 type: clientData.type
      //               } : null
      //             });
      //           }
      //         }
      //       });
      //     }
      //   }
      // }
      
      // // If some applications don't have passenger data, add them with null passenger
      // applications.forEach(app => {
      //   if (!enrichedApplications.some(enriched => enriched.id === app.id)) {
      //     const clientData = app.client_user_id ? clientsData.get(app.client_user_id) : null;
          
      //     enrichedApplications.push({
      //       ...app,
      //       passenger: null,
      //       client: clientData ? {
      //         id: clientData.id,
      //         name: clientData.name,
      //         type: clientData.type
      //       } : null
      //     });
      //   }
      // });
      
    } catch (e) {
      logger.error(
        `error in applicationService.search - ${generateError(e)}`
      );
      response.setMessage("An error occurred while searching applications");
      return response;
    }
  };

  const verifyPassengerChange = async (savedPassengerinfo: RepoPassengerData, newPassengerinfo: PersonalInfo, newPassportInfo: PassportInfo, newAddressInfo: AddressInfo) => {
    try {
      logger.info(`savedPassengerinfo - ${generateError({savedPassengerinfo})}`);
      logger.info(`newPassengerinfo - ${generateError({newPassengerinfo})}`);
      logger.info(`newPassportInfo - ${generateError({newPassportInfo})}`);
      logger.info(`newAddressInfo - ${generateError({newAddressInfo})}`);

      // Check personal info fields
      const isFirstNameSame = savedPassengerinfo.first_name === newPassengerinfo.first_name;
      logger.info(`First name comparison - ${generateError({savedFirstName: savedPassengerinfo.first_name, newFirstName: newPassengerinfo.first_name, isMatching: isFirstNameSame})}`);
      
      const isLastNameSame = savedPassengerinfo.last_name === newPassengerinfo.last_name;
      logger.info(`Last name comparison - ${generateError({savedLastName: savedPassengerinfo.last_name, newLastName: newPassengerinfo.last_name, isMatching: isLastNameSame})}`);
      
      const isEmailSame = savedPassengerinfo.email === newPassengerinfo.email_id;
      logger.info(`Email comparison - ${generateError({savedEmail: savedPassengerinfo.email, newEmail: newPassengerinfo.email_id, isMatching: isEmailSame})}`);
      
      // Fixed date handling - extract YYYY-MM-DD safely from ISO date string
  
      const savedDobFormatted = getDatePart(savedPassengerinfo.dob);
      const isDobSame = savedDobFormatted === newPassengerinfo.date_of_birth;
      logger.info(`DOB comparison - ${generateError({
        savedDob: savedDobFormatted,
        originalSavedDob: savedPassengerinfo.dob,
        newDob: newPassengerinfo.date_of_birth, 
        isMatching: isDobSame
      })}`);
      
      const isProcessingBranchSame = savedPassengerinfo.processing_branch === newPassengerinfo.processing_branch;
      logger.info(`Processing branch comparison - ${generateError({savedBranch: savedPassengerinfo.processing_branch, newBranch: newPassengerinfo.processing_branch, isMatching: isProcessingBranchSame})}`);
      
    const isPersonalInfoSame = 
        isFirstNameSame &&
        isLastNameSame &&
        isEmailSame &&
        isDobSame &&
        isProcessingBranchSame;
      logger.info(`Overall personal info comparison - ${generateError({isPersonalInfoSame})}`);
      
      // Check passport info fields
      const isPassportNumberSame = savedPassengerinfo.passport_number === newPassportInfo.passport_number;
      logger.info(`Passport number comparison - ${generateError({savedPassportNumber: savedPassengerinfo.passport_number, newPassportNumber: newPassportInfo.passport_number, isMatching: isPassportNumberSame})}`);
      
      const savedDateOfIssueFormatted = getDatePart(savedPassengerinfo.passport_date_of_issue);
      const isDateOfIssueSame = savedDateOfIssueFormatted === newPassportInfo.date_of_issue;
      logger.info(`Passport date of issue comparison - ${generateError({
        savedDateOfIssue: savedDateOfIssueFormatted,
        originalSavedDateOfIssue: savedPassengerinfo.passport_date_of_issue,
        newDateOfIssue: newPassportInfo.date_of_issue, 
        isMatching: isDateOfIssueSame
      })}`);
      
      const savedDateOfExpiryFormatted = getDatePart(savedPassengerinfo.passport_date_of_expiry);
      const isDateOfExpirySame = savedDateOfExpiryFormatted === newPassportInfo.date_of_expiry;
      logger.info(`Passport date of expiry comparison - ${generateError({
        savedDateOfExpiry: savedDateOfExpiryFormatted,
        originalSavedDateOfExpiry: savedPassengerinfo.passport_date_of_expiry,
        newDateOfExpiry: newPassportInfo.date_of_expiry, 
        isMatching: isDateOfExpirySame
      })}`);
      
      const isIssueAtSame = savedPassengerinfo.passport_issue_at === newPassportInfo.issue_at;
      logger.info(`Passport issue at comparison - ${generateError({savedIssueAt: savedPassengerinfo.passport_issue_at, newIssueAt: newPassportInfo.issue_at, isMatching: isIssueAtSame})}`);
      
      const isExpiredPassportCountSame = String(savedPassengerinfo.count_of_expired_passport) === String(newPassportInfo.no_of_expired_passport);
      logger.info(`Expired passport count comparison - ${generateError({savedCount: savedPassengerinfo.count_of_expired_passport, newCount: newPassportInfo.no_of_expired_passport, isMatching: isExpiredPassportCountSame})}`);
      
      const isExpiredPassportNumberSame = savedPassengerinfo.expired_passport_number === newPassportInfo.expired_passport_number;
      logger.info(`Expired passport number comparison - ${generateError({savedExpiredNumber: savedPassengerinfo.expired_passport_number, newExpiredNumber: newPassportInfo.expired_passport_number, isMatching: isExpiredPassportNumberSame})}`);
    
    const isPassportInfoSame =
        isPassportNumberSame &&
        isDateOfIssueSame &&
        isDateOfExpirySame &&
        isIssueAtSame &&
        isExpiredPassportCountSame &&
        isExpiredPassportNumberSame;
      logger.info(`Overall passport info comparison - ${generateError({isPassportInfoSame})}`);
      
      // Check address info fields
      const isAddressLine1Same = savedPassengerinfo.address_line_1 === newAddressInfo.address_line1;
      logger.info(`Address line 1 comparison - ${generateError({savedAddressLine1: savedPassengerinfo.address_line_1, newAddressLine1: newAddressInfo.address_line1, isMatching: isAddressLine1Same})}`);
      
      const isAddressLine2Same = (savedPassengerinfo.address_line_2 || '') === (newAddressInfo.address_line2 || '');
      logger.info(`Address line 2 comparison - ${generateError({savedAddressLine2: savedPassengerinfo.address_line_2 || '', newAddressLine2: newAddressInfo.address_line2 || '', isMatching: isAddressLine2Same})}`);
      
      const isCountrySame = String(savedPassengerinfo.country) === String(newAddressInfo.country);
      logger.info(`Country comparison - ${generateError({savedCountry: savedPassengerinfo.country, newCountry: newAddressInfo.country, isMatching: isCountrySame})}`);
      
      const isStateSame = String(savedPassengerinfo.state) === String(newAddressInfo.state);
      logger.info(`State comparison - ${generateError({savedState: savedPassengerinfo.state, newState: newAddressInfo.state, isMatching: isStateSame})}`);
      
      const isCitySame = String(savedPassengerinfo.city) === String(newAddressInfo.city);
      logger.info(`City comparison - ${generateError({savedCity: savedPassengerinfo.city, newCity: newAddressInfo.city, isMatching: isCitySame})}`);
      
      const isZipSame = savedPassengerinfo.zip === newAddressInfo.zip;
      logger.info(`Zip comparison - ${generateError({savedZip: savedPassengerinfo.zip, newZip: newAddressInfo.zip, isMatching: isZipSame})}`);
      
      const isOccupationSame = savedPassengerinfo.occupation === newAddressInfo.occupation;
      logger.info(`Occupation comparison - ${generateError({savedOccupation: savedPassengerinfo.occupation, newOccupation: newAddressInfo.occupation, isMatching: isOccupationSame})}`);
      
      const isPositionSame = savedPassengerinfo.position === newAddressInfo.position;
      logger.info(`Position comparison - ${generateError({savedPosition: savedPassengerinfo.position, newPosition: newAddressInfo.position, isMatching: isPositionSame})}`);
    
    const isAddressInfoSame =
        isAddressLine1Same &&
        isAddressLine2Same &&
        isCountrySame &&
        isStateSame &&
        isCitySame &&
        isZipSame &&
        isOccupationSame &&
        isPositionSame;
      logger.info(`Overall address info comparison - ${generateError({isAddressInfoSame})}`);
    
    const isAllInfoSame = isPersonalInfoSame && isPassportInfoSame && isAddressInfoSame;
      logger.info(`Overall passenger change verification - ${generateError({isAllInfoSame})}`);
    
    return {
      isChanged: !isAllInfoSame,
      details: {
        isPersonalInfoSame,
        isPassportInfoSame,
          isAddressInfoSame,
          personalInfoDetails: {
            isFirstNameSame,
            isLastNameSame,
            isEmailSame,
            isDobSame,
            isProcessingBranchSame
          },
          passportInfoDetails: {
            isPassportNumberSame,
            isDateOfIssueSame,
            isDateOfExpirySame,
            isIssueAtSame,
            isExpiredPassportCountSame,
            isExpiredPassportNumberSame
          },
          addressInfoDetails: {
            isAddressLine1Same,
            isAddressLine2Same,
            isCountrySame,
            isStateSame,
            isCitySame,
            isZipSame,
            isOccupationSame,
            isPositionSame
          }
        }
      };
    } catch (e) {
      logger.error(`error in applicationService.verifyPassengerChange - ${generateError(e)}`);
      throw e;
    }
  }

  const addStep3Data = async (
    request: AddStep3DataRequest
  ): Promise<ResponseModel> => {
    const response = new ResponseModel(false);
    
    try {
      const { 
        personal_info, 
        passport_info, 
        travel_info, 
        visa_requests, 
        address_info, 
        mi_fields, 
        application_id,
        reference_number,
        token_user_id,
        is_sub_request
      } = request;
      
      logger.info(`addStep3Data started - ${generateError({is_sub_request, application_id, reference_number})}`);
      
      // Determine if this is a new sub-request or an update to existing application
      if (!is_sub_request) {
        // CASE 1: Update existing application
        logger.info(`Case 1: Update existing application - ${generateError({application_id})}`);
        
        // Fetch the complete application data (including passenger info and visa requests)
      const applicationWithPassengerResult = await applicationRepository.getApplicationWithPassenger(
          application_id
      );
        logger.info(`getApplicationWithPassenger result - ${generateError(applicationWithPassengerResult)}`);
      
      if (!applicationWithPassengerResult.status || !applicationWithPassengerResult.data || applicationWithPassengerResult.data.length === 0) {
        response.message = `Application with ID ${application_id} not found`;
        return response;
      }

        const applicationData = applicationWithPassengerResult.data[0] as any; // Using 'any' type to handle joined data
        let passengerId: number;
        
        // Check if passenger already exists and if data has changed
        if (applicationData.passenger_id) {
          logger.info(`Passenger exists - ${generateError({passenger_id: applicationData.passenger_id})}`);
          
          // Create passenger info object from application data
          const passengerInfo: RepoPassengerData = createPassengerInfoFromApplicationData(applicationData);
          logger.info(`Created passenger info from application data - ${generateError({passengerInfo})}`);
          
          // Verify if passenger details have changed
          const verifyResult = await verifyPassengerChange(
            passengerInfo,
        personal_info,
        passport_info,
            address_info
          );
          logger.info(`Passenger change verification result - ${generateError({verifyResult})}`);

          if (verifyResult.isChanged) {
            logger.info(`Passenger details have changed - creating new passenger`);
            // Create new passenger with updated details
            const passengerData: any = {
              first_name: personal_info.first_name,
              last_name: personal_info.last_name,
              email: personal_info.email_id,
              dob: personal_info.date_of_birth,
              processing_branch: personal_info.processing_branch,
              passport_number: passport_info.passport_number,
              passport_date_of_issue: passport_info.date_of_issue,
              passport_date_of_expiry: passport_info.date_of_expiry,
              passport_issue_at: passport_info.issue_at,
              count_of_expired_passport: passport_info.no_of_expired_passport,
              expired_passport_number: passport_info.expired_passport_number,
              address_line_1: address_info.address_line1,
              address_line_2: address_info.address_line2 || '',
              country: address_info.country,
              state: address_info.state,
              city: address_info.city,
              zip: address_info.zip,
              occupation: address_info.occupation,
              position: address_info.position,
              last_updated_by: token_user_id || 0,
              status: constants.STATUS.PASSENGER.ACTIVE
            };
            
            const passengerResult = await passengerRepository.insertPassenger(passengerData);
            logger.info(`insertPassenger result - ${generateError({passengerResult})}`);
            
            if (!passengerResult.status) {
              throw new Error("Failed to create passenger");
            }
            
            passengerId = passengerResult.data.insertId;
            
            // Remove old passenger mapping (by updating status) and create new mapping
            if (applicationData.id) {
              // Update status of old mapping to inactive
              const updateStatusResult = await applicationPassengerRepository.updateStatus(
                constants.STATUS.APPLICATION_PASSENGER_MAPPING.INACTIVE,
                applicationData.passenger_id,
                applicationData.id,
                token_user_id || 0
              );
              logger.info(`updateStatus result - ${generateError({updateStatusResult})}`);
              
              // Create new mapping between application and new passenger
              const createMappingResult = await applicationPassengerRepository.createMapping(
                applicationData.id,
                passengerId,
                token_user_id || 0
              );
              logger.info(`createMapping result - ${generateError({createMappingResult})}`);
            }
          } else {
            logger.info(`Passenger details unchanged - using existing passenger`);
            // Use existing passenger
            passengerId = applicationData.passenger_id;
          }
        } else {
          logger.info(`No existing passenger - creating new passenger`);
          // Create new passenger when none exists
          const passengerData: any = {
            first_name: personal_info.first_name,
            last_name: personal_info.last_name,
            email: personal_info.email_id,
            dob: personal_info.date_of_birth,
            processing_branch: personal_info.processing_branch,
            passport_number: passport_info.passport_number,
            passport_date_of_issue: passport_info.date_of_issue,
            passport_date_of_expiry: passport_info.date_of_expiry,
            passport_issue_at: passport_info.issue_at,
            count_of_expired_passport: passport_info.no_of_expired_passport,
            expired_passport_number: passport_info.expired_passport_number,
            address_line_1: address_info.address_line1,
            address_line_2: address_info.address_line2 || '',
            country: address_info.country,
            state: address_info.state,
            city: address_info.city,
            zip: address_info.zip,
            occupation: address_info.occupation,
            position: address_info.position,
            last_updated_by: token_user_id || 0,
            status: constants.STATUS.PASSENGER.ACTIVE
          };
          
          const passengerResult = await passengerRepository.insertPassenger(passengerData);
          logger.info(`insertPassenger result - ${generateError({passengerResult})}`);
          
          if (!passengerResult.status) {
            throw new Error("Failed to create passenger");
          }
          
          passengerId = passengerResult.data.insertId;
          
          // Create mapping between application and new passenger
          if (applicationData.id) {
            const createMappingResult = await applicationPassengerRepository.createMapping(
              applicationData.id,
          passengerId,
              token_user_id || 0
            );
            logger.info(`createMapping result - ${generateError({createMappingResult})}`);
          }
        }
        
        // Get existing visa requests for the application
        let existingVisaRequests: any[] = [];
        const existingMappings = await applicationVisaRequestMappingRepository.getByApplicationId(application_id);
        logger.info(`getByApplicationId result - ${generateError({existingMappings})}`);
        
        if (existingMappings.status && existingMappings.data && existingMappings.data.length > 0) {
          const existingVisaRequestIds = existingMappings.data.map(mapping => mapping.visa_request_id);
          logger.info(`Extracted visa request IDs - ${generateError({existingVisaRequestIds})}`);
          
          const visaRequestsResponse = await visaRequestRepository.getByIds(existingVisaRequestIds);
          logger.info(`getByIds result - ${generateError({visaRequestsResponse})}`);
          
          if (visaRequestsResponse.status && visaRequestsResponse.data) {
            existingVisaRequests = visaRequestsResponse.data;
          }
        }
        
        // Process visa requests - compare and only create those that don't exist
        if (visa_requests && visa_requests.length > 0) {
          logger.info(`Processing ${visa_requests.length} visa requests`);
          
          // Create a map of existing visa requests for easy lookup
          const existingVisaRequestMap = new Map();
          existingVisaRequests.forEach(request => {
            // Create a unique key based on visa request properties
            const key = `${request.visa_country}_${request.visa_category}_${request.nationality}_${request.state}_${request.entry_type}_${request.remarks}`;
            existingVisaRequestMap.set(key, {
              id: request.id,
              mappingId: existingMappings.data?.find(m => m.visa_request_id === request.id)?.id
            });
          });
          logger.info(`Created lookup map of existing visa requests - ${generateError({mapSize: existingVisaRequestMap.size, existingVisaRequestMap: existingVisaRequestMap})}`);
          
          // Identify which existing mappings to keep and which new visa requests to create
          const mappingsToKeep = new Set<number>();
          const newVisaRequestsData: VisaRequestData[] = [];
          
          for (const request of visa_requests) {
            const key = `${request.visa_country}_${request.visa_category}_${request.nationality}_${request.state}_${request.entry_type}_${request.remark}`;
            logger.info(`Visa_request key- ${generateError({key})}`);
            if (existingVisaRequestMap.has(key)) {
              logger.info(`Visa_request key exists- ${generateError({key})}`);

              // This visa request already exists, keep the mapping
              const existingInfo = existingVisaRequestMap.get(key);
              if (existingInfo && existingInfo.mappingId) {
                mappingsToKeep.add(existingInfo.mappingId);
                existingVisaRequestMap.delete(key)
              }
            } else {
              // This is a new visa request, add it to the batch insert list
              newVisaRequestsData.push({
                visa_country: request.visa_country,
                visa_category: request.visa_category,
                nationality: request.nationality,
                state: request.state,
                entry_type: request.entry_type,
                remarks: request.remark || '',
                last_updated_by: token_user_id || 0
              });
            }
          }
          logger.info(`Identified mappings to keep and new visa requests - ${generateError({mappingsToKeep: mappingsToKeep, newVisaRequestsData: newVisaRequestsData, mappingsToRemove: existingVisaRequestMap})}`);
          
          // Mark mappings as inactive if they're not in the keep list
          let mappingsToInactivate: number[] = [];
          
          // Extract mapping IDs from the remaining visa requests in the map
          existingVisaRequestMap.forEach((value) => {
            if (value && value.mappingId) {
              mappingsToInactivate.push(value.mappingId);
            }
          });

          logger.info(`Identified mappings to inactivate - ${generateError({mappingsToInactivate, mappingsToInactivateCount: mappingsToInactivate.length})}`);
          
          if (mappingsToInactivate.length > 0) {
            // Update each mapping status to inactive using the new function
            const inactivateMappingsResult = await applicationVisaRequestMappingRepository.updateStatusByIds(
              mappingsToInactivate,
              constants.STATUS.APPLICATION_VISA_REQUEST_MAPPING.INACTIVE,
              token_user_id || 0
            );
            logger.info(`Inactivate mappings result - ${generateError({inactivateMappingsResult, mappingsToInactivate})}`);
          }
          
          // Batch insert new visa requests
          if (newVisaRequestsData.length > 0) {
            logger.info(`Starting batch insert of ${newVisaRequestsData.length} new visa requests`);
            
            // Create a connection for batch operations
            const connection = await MySql.getConnection();
            logger.info(`Got MySQL connection for batch operations`);
            
            try {
              const visaResult = await visaRequestRepository.batchInsert(newVisaRequestsData);
              logger.info(`Batch insert visa requests result - ${generateError({visaResult})}`);
              
              if (!visaResult.status || !visaResult.data) {
                throw new Error("Failed to insert visa requests");
              }
              
              // Get the inserted visa request IDs
              const newVisaRequestIds = visaResult.data.insertIds || [];
              logger.info(`New visa request IDs - ${generateError({newVisaRequestIds})}`);
              
              // Create mappings for new visa requests
              if (newVisaRequestIds.length > 0) {
                for (const visaId of newVisaRequestIds) {
                  const createMappingResult = await applicationVisaRequestMappingRepository.createMapping(
                    application_id,
                    visaId,
          token_user_id || 0,
                  );
                  logger.info(`Create mapping result for new visa ID ${visaId} - ${generateError({createMappingResult})}`);
                }
              }
            } finally {
              connection.release();
              logger.info(`Released MySQL connection after batch operations`);
            }
          }
        // } else if (existingMappings.data && existingMappings.data.length > 0) {
        //   logger.info(`No visa requests provided, handling existing mappings - ${generateError({existingMappingsCount: existingMappings.data.length})}`);
          
        //   // No visa requests provided, mark all existing mappings as inactive
        //   // Similar to above, we need to handle this case through individual updates
        //   for (const mapping of existingMappings.data) {
        //     if (mapping.id) {
        //       // TODO: Add proper API for updating mapping status
        //       // For now, we'll handle this through existing APIs
        //       logger.info(`Should inactivate mapping - ${generateError({mappingId: mapping.id})}`);
        //     }
        //   }
        }
        
        // Update application with basic information
        const applicationUpdateData = {
          id: application_id,
          travel_date: travel_info.travel_date,
          interview_date: travel_info.interview_date,
          file_number_2: travel_info.file_no,
          is_travel_date_tentative: travel_info.is_travel_date_tentative,
          priority_submission: travel_info.priority_submission,
          olvt_number: mi_fields?.olvt_number || null,
          external_status: APPLICATION_EXTERNAL_STATUS.IN_TRANSIT,
          queue: APPLICATION_QUEUES.IN_TRANSIT,
          status: constants.STATUS.APPLICATION.STEP3_DONE
        };
        logger.info(`Updating application with step 3 data - ${generateError({applicationUpdateData})}`);
        
        const updateResult = await applicationRepository.updateStep3Data(applicationUpdateData);
        logger.info(`Update application step 3 data result - ${generateError({updateResult})}`);
        
        if (!updateResult.status) {
          throw new Error("Failed to update application");
        }
        
        // Get client name for response
        let clientName = "";
        if (applicationData.client_user_id) {
          const clientData = await clientRepository.getByUserId(applicationData.client_user_id);
          logger.info(`Get client data result - ${generateError({clientData})}`);
          
          if (clientData.status && clientData.data) {
            clientName = clientData.data[0].name;
          }
      }
      
      response.setStatus(true);
      response.message = "Application Updated Successfully.";
      response.data = {
          application_requests: {
            ...request,
            client_name: clientName,
            client_user_id: applicationData.client_user_id,
          }
        };
        logger.info(`Case 1 completed successfully - ${generateError({responseStatus: response.status, responseMessage: response.message})}`);
        
      } else {
        // CASE 2: Create new application as a sub-request
        logger.info(`Case 2: Create new application as a sub-request - ${generateError({reference_number})}`);
        
        // Fetch application data using reference number
        if (!reference_number) {
          response.message = "Reference number is required for sub-requests";
      return response;
        }
        
        const existingApplicationResult = await applicationRepository.getByReferenceNumber(reference_number);
        logger.info(`getByReferenceNumber result - ${generateError({existingApplicationResult})}`);
        
        if (!existingApplicationResult.status || !existingApplicationResult.data || existingApplicationResult.data.length === 0) {
          response.message = `Invalid reference number: ${reference_number}`;
      return response;
        }
        
        const existingApplication = existingApplicationResult.data[0];
        
        // Create new application with Step 1 data
        const newApplicationData: AddStep1DataRequest = {
          pax_type: existingApplication.pax_type,
          country_of_residence: existingApplication.country_of_residence,
          client_user_id: existingApplication.client_user_id,
          state_of_residence: existingApplication.state_of_residence,
          citizenship: existingApplication.citizenship,
          service_type: existingApplication.service_type,
          referrer: existingApplication.referrer,
          file_number: travel_info.file_no,
          last_updated_by: token_user_id || 0,
          reference_number: reference_number,
          status: constants.STATUS.APPLICATION.STEP1_DONE
        };
        logger.info(`Creating new application with step 1 data - ${generateError({newApplicationData})}`);
        
        const newAppResult = await applicationRepository.insertAddStep1Data(newApplicationData);
        logger.info(`Insert new application result - ${generateError({newAppResult})}`);
        
        if (!newAppResult.status) {
          throw new Error("Failed to create new application as sub-request");
        }
        
        const newApplicationId = newAppResult.data.insertId;
        
        // Create new passenger
        const passengerData: any = {
          first_name: personal_info.first_name,
          last_name: personal_info.last_name,
          email: personal_info.email_id,
          dob: personal_info.date_of_birth,
          processing_branch: personal_info.processing_branch,
          passport_number: passport_info.passport_number,
          passport_date_of_issue: passport_info.date_of_issue,
          passport_date_of_expiry: passport_info.date_of_expiry,
          passport_issue_at: passport_info.issue_at,
          count_of_expired_passport: passport_info.no_of_expired_passport,
          expired_passport_number: passport_info.expired_passport_number,
          address_line_1: address_info.address_line1,
          address_line_2: address_info.address_line2 || '',
          country: address_info.country,
          state: address_info.state,
          city: address_info.city,
          zip: address_info.zip,
          occupation: address_info.occupation,
          position: address_info.position,
          last_updated_by: token_user_id || 0,
          status: constants.STATUS.PASSENGER.ACTIVE
        };
        logger.info(`Creating new passenger for sub-request - ${generateError({passengerData})}`);
        
        const passengerResult = await passengerRepository.insertPassenger(passengerData);
        logger.info(`Insert passenger result - ${generateError({passengerResult})}`);
        
        if (!passengerResult.status) {
          throw new Error("Failed to create passenger for sub-request");
        }
        
        const passengerId = passengerResult.data.insertId;
        
        // Create mapping between new application and passenger
        const mappingResult = await applicationPassengerRepository.createMapping(
          newApplicationId,
          passengerId,
          token_user_id || 0
        );
        logger.info(`Create passenger mapping result - ${generateError({mappingResult})}`);
        
        // Create visa requests and batch create mappings
        const visaRequestIds: number[] = [];
        
        if (visa_requests && visa_requests.length > 0) {
          logger.info(`Processing ${visa_requests.length} visa requests for sub-request`);
          
          const connection = await MySql.getConnection();
          logger.info(`Got MySQL connection for visa request operations`);
          
          try {
            // Insert each visa request
            for (const request of visa_requests) {
              const visaRequestData: VisaRequestData = {
                visa_country: request.visa_country,
                visa_category: request.visa_category,
                nationality: request.nationality,
                state: request.state,
                entry_type: request.entry_type,
                remarks: request.remark || '',
                last_updated_by: token_user_id || 0
              };
              
              const visaResult = await visaRequestRepository.insertWithConnection(visaRequestData);
              logger.info(`Insert visa request result - ${generateError({visaResult, visaRequestData})}`);
              
              if (!visaResult.status) {
                throw new Error("Failed to insert visa request for sub-request");
              }
              
              visaRequestIds.push(visaResult.data.insertId);
            }
            
            // Create mappings for all visa requests
            for (const visaId of visaRequestIds) {
              const mappingResult = await applicationVisaRequestMappingRepository.createMapping(
                newApplicationId,
                visaId,
                token_user_id || 0,
              );
              logger.info(`Create visa request mapping result - ${generateError({mappingResult, visaId})}`);
            }
          } finally {
            connection.release();
            logger.info(`Released MySQL connection after visa request operations`);
          }
        }
        
        // Update application with step 3 data
        const applicationUpdateData = {
          id: newApplicationId,
          travel_date: travel_info.travel_date,
          interview_date: travel_info.interview_date,
          file_number_1: travel_info.file_no,
          is_travel_date_tentative: travel_info.is_travel_date_tentative,
          priority_submission: travel_info.priority_submission,
          olvt_number: mi_fields?.olvt_number || null,
          external_status: APPLICATION_EXTERNAL_STATUS.IN_TRANSIT,
          queue: APPLICATION_QUEUES.IN_TRANSIT,
          status: constants.STATUS.APPLICATION.STEP3_DONE
        };
        logger.info(`Updating sub-request application with step 3 data - ${generateError({applicationUpdateData})}`);
        
        const updateResult = await applicationRepository.updateStep3Data(applicationUpdateData);
        logger.info(`Update sub-request application result - ${generateError({updateResult})}`);
        
        if (!updateResult.status) {
          throw new Error("Failed to update application details for sub-request");
        }
        
        // Get client name for response
        let clientName = "";
        if (existingApplication.client_user_id) {
          const clientData = await clientRepository.getByUserId(existingApplication.client_user_id);
          logger.info(`Get client data result - ${generateError({clientData})}`);
          
          if (clientData.status && clientData.data) {
            clientName = clientData.data[0].name;
          }
        }
      
        response.setStatus(true);
        response.message = "Sub-request Application Created Successfully.";
        response.data = {
          application_requests: {
            ...request,
            application_id: newApplicationId,
            client_name: clientName,
            client_user_id: existingApplication.client_user_id,
          }
        };
        logger.info(`Case 2 completed successfully - ${generateError({responseStatus: response.status, responseMessage: response.message})}`);
      }
      
      return response;
    } catch (e) {
      logger.error(`Error in ApplicationService.addStep3Data: ${generateError(e)}`);
      response.message = "Failed to save application info";
      return response;
    }
  };

  /**
   * Create a passenger info object from application data
   */
  const createPassengerInfoFromApplicationData = (applicationData: any): RepoPassengerData => {
    try {
    return {
      id: applicationData.passenger_id,
      first_name: applicationData.first_name,
      last_name: applicationData.last_name,
      email: applicationData.email,
      dob: applicationData.dob,
      phone: applicationData.phone || "",
      processing_branch: applicationData.processing_branch,
      passport_number: applicationData.passport_number,
      passport_date_of_issue: applicationData.passport_date_of_issue,
      passport_date_of_expiry: applicationData.passport_date_of_expiry,
      passport_issue_at: applicationData.passport_issue_at,
      count_of_expired_passport: applicationData.count_of_expired_passport,
      expired_passport_number: applicationData.expired_passport_number,
      address_line_1: applicationData.address_line_1,
      address_line_2: applicationData.address_line_2 || "",
      country: applicationData.country,
      state: applicationData.state,
      city: applicationData.city,
      zip: applicationData.zip,
      occupation: applicationData.occupation,
      position: applicationData.position,
      status: applicationData.status,
      last_updated_by: applicationData.last_updated_by
    };
    } catch (e) {
      logger.error(`error in applicationService.createPassengerInfoFromApplicationData - ${generateError(e)}`);
      throw e;
    }
  };

  const getDatePart = (dateValue: any): string => {
    if (!dateValue) return '';
    // Handle ISO date strings with T separator (e.g. 1983-12-12T00:00:00.000Z)
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      return dateValue.split('T')[0];
    }
    // Handle Date objects or other formats by converting to ISO and taking first 10 chars
    try {
      return new Date(dateValue).toISOString().substring(0,10);
    } catch (e) {
      // Fallback - try direct substring if date conversion fails
      return String(dateValue).substring(0,10);
    }
  };

  /**
   * Update Application Details
   */
  const updateApplicationDetails = async (request: any): Promise<ResponseModel> => {
    const response = new ResponseModel();
    try {
      const {
        id,
        queue,
        external_status,
        team_remarks,
        client_remarks,
        billing_remarks,
        dox_received_at,
        submission_at,
        collection_at,
        token_user_id,
      } = request;

      // Verify if application exists
      const appInfo = await applicationRepository.getById(id);
      if (!appInfo.data || appInfo.data.length === 0) {
        response.status = false;
        response.message = "No application found with this id";
        return response;
      }

      // Update application details
      const resp = await applicationRepository.updateApplicationDetails(
        id,
        queue,
        external_status,
        team_remarks,
        client_remarks,
        billing_remarks,
        dox_received_at,
        submission_at,
        collection_at,
        token_user_id
      );

      if (resp.status === false) {
        response.status = false;
        response.message = "Failed to update application details";
        return response;
      }

      response.status = true;
      response.message = "Application details updated successfully";
      return response;
    } catch (e) {
      logger.error(`Error in updateApplicationDetails ${generateError(e)}`);
      response.status = false;
      response.message = "Failed to update application details";
      return response;
    }
  };

  return {
    addStep1Data,
    addStep2Data,
    addStep3Data,
    addStep4Data,
    searchPax,
    search,
    updateApplicationDetails,
  };
};

export default applicationService;
