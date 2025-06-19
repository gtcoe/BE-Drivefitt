interface AuthConfig {
  jwtSecret: string;
}

const auth: AuthConfig = {
  jwtSecret: "bezkoder-secret-key",
};

export default auth;
