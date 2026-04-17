export type AuthTokenUser = {
  id: string;
  email?: string;
  password?: string;
  created_at?: string | Date;
};

export type AuthTokenPayload = {
  sub: string;
  user: AuthTokenUser;
  iat?: number;
  exp?: number;
};
