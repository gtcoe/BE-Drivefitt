const constants = {
  TABLES: {
    USERS: "users",
    USER_DETAILS: "user_details",
    SUBSCRIPTION: "subscription",
    ADMINS: "admins",
    CAREERS: "careers",
    BLOGS: "blogs",
    CONTACT_US: "contact_us",
    FRANCHISE_INQUIRIES: "franchise_inquiries",
    USER_LOGINS: "user_logins",
    PAYMENTS: "payments",
  },

  STATUS: {
    USER: {
      ACTIVE: 1,
      INACTIVE: 2,
      SUSPENDED: 3,
    },
    ADMIN: {
      ACTIVE: 1,
      INACTIVE: 2,
    },
    CAREER: {
      ACTIVE: 1,
      INACTIVE: 2,
      DRAFT: 3,
    },
    BLOG: {
      PUBLISHED: 1,
      DRAFT: 2,
      ARCHIVED: 3,
    },
    CONTACT: {
      NEW: 1,
      IN_PROGRESS: 2,
      RESOLVED: 3,
      CLOSED: 4,
    },
    FRANCHISE: {
      NEW: 1,
      CONTACTED: 2,
      IN_DISCUSSION: 3,
      APPROVED: 4,
      REJECTED: 5,
    },
    SUBSCRIPTION: {
      ACTIVE: "active",
      PAUSED: "paused",
      CANCELLED: "cancelled",
      EXPIRED: "expired",
    },
    PAYMENT: {
      PENDING: "pending",
      SUCCESS: "success",
      FAILED: "failed",
      CANCELLED: "cancelled",
      REFUNDED: "refunded",
    },
    PAYMENT_STATUS: {
      PENDING: "pending",
      PAID: "paid",
      FAILED: "failed",
    },
    CMS_SYNC: {
      UNSYNCED: "unsynced",
      SYNCED: "synced",
      FAILED: "failed",
    },
    LOGIN: {
      SUCCESS: "success",
      FAILED: "failed",
      BLOCKED: "blocked",
    },
  },

  GENDER: {
    MALE: "male",
    FEMALE: "female",
    OTHER: "other",
    MALE_CAP: "Male",
    FEMALE_CAP: "Female",
    OTHERS_CAP: "others",
  },

  DISCOUNT_TYPES: {
    PERCENTAGE: "percentage",
    FIXED: "fixed",
    TRIAL: "trial",
  },

  JOB_TYPES: {
    FULL_TIME: "Full-time",
    PART_TIME: "Part-time",
    CONTRACT: "Contract",
    INTERNSHIP: "Internship",
  },

  EXPERIENCE_LEVELS: {
    ENTRY: "Entry",
    MID: "Mid",
    SENIOR: "Senior",
    EXECUTIVE: "Executive",
  },

  LOGIN_TYPES: {
    WEB: "web",
    MOBILE: "mobile",
    API: "api",
  },

  PAYMENT_METHODS: {
    CARD: "card",
    UPI: "upi",
    NETBANKING: "netbanking",
    WALLET: "wallet",
    EMI: "emi",
  },

  PAYMENT_GATEWAYS: {
    RAZORPAY: "razorpay",
    STRIPE: "stripe",
    PAYU: "payu",
    CASHFREE: "cashfree",
  },

  CACHE_KEYS: {
    USERS_LIST: "users_list",
    SUBSCRIPTIONS_LIST: "subscriptions_list",
    CAREERS_LIST: "careers_list",
    BLOGS_LIST: "blogs_list",
    CONTACT_LIST: "contact_list",
    FRANCHISE_LIST: "franchise_list",
    USER_LOGINS_LIST: "user_logins_list",
    PAYMENTS_LIST: "payments_list",
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },

  CACHE_TTL: {
    SHORT: 300, // 5 minutes
    MEDIUM: 1800, // 30 minutes
    LONG: 3600, // 1 hour
  },

  S3: {
    BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || "drivefitt",
    REGION: process.env.AWS_REGION || "ap-south-1",
    CDN_URL: process.env.AWS_CLOUDFRONT_URL || "https://da8nru77lsio9.cloudfront.net",
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    UPLOAD_PATHS: {
      BLOGS: "images/",
      CAREERS: "images/",
      PROFILES: "images/",
      GENERAL: "images/",
    },
  },

  SVG_PROCESSING: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB for SVG files
    ALLOWED_TYPES: ["image/svg+xml", "image/svg"],
    DEFAULT_QUALITY: 80,
    DEFAULT_WIDTH: 1920,
    DEFAULT_HEIGHT: 1080,
    MIN_QUALITY: 10,
    MAX_QUALITY: 100,
  },

  SIGN_IN_STATUS_TYPE: {
    SUCCESS: 1,
    INCORRECT_PASSWORD: 2,
    INACTIVE_BY_ADMIN: 3,
    EMAIL_NOT_FOUND: 4,
  },

  SIGN_IN_STATUS_MESSAGE: {
    SUCCESS: "Login successful",
    INCORRECT_PASSWORD: "Incorrect password. Please try again.",
    INACTIVE_BY_ADMIN: "Account is inactive. Contact administrator.",
    EMAIL_NOT_FOUND: "Email does not exist.",
  },

  ERROR_MESSAGES: {
    INVALID_CREDENTIALS: "Invalid email or password",
    ACCESS_DENIED: "Access denied",
    RESOURCE_NOT_FOUND: "Resource not found",
    VALIDATION_ERROR: "Validation error",
    SERVER_ERROR: "Internal server error",
    CACHE_INVALIDATED: "Cache invalidated successfully",
    EMAIL_ALREADY_EXISTS: "Email already exists",
    PHONE_ALREADY_EXISTS: "Phone number already exists",
    USER_NOT_FOUND: "User not found",
    SUBSCRIPTION_NOT_FOUND: "Subscription not found",
  },

  SUCCESS_MESSAGES: {
    CREATED: "Resource created successfully",
    UPDATED: "Resource updated successfully",
    DELETED: "Resource deleted successfully",
    FETCHED: "Data fetched successfully",
    CACHE_CLEARED: "Cache cleared successfully",
    USER_REGISTERED: "User registered successfully",
    LOGIN_SUCCESSFUL: "Login successful",
    PROFILE_UPDATED: "Profile updated successfully",
    SUBSCRIPTION_CREATED: "Subscription created successfully",
  },
};

export default constants; 