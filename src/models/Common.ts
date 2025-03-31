import { RoleType } from "src/types/enum";

export interface LoginResponse {
    token: string;
    id: number;
    role: RoleType
}

export interface LoginInput {
    id: number;
    password: string;
    role: RoleType
}