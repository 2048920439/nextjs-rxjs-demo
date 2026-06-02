export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}
