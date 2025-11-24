import { gql } from "apollo-server-micro";

export const authTypeDefs = gql`
  # User Type
  type User {
    id: Int!
    email: String!
    username: String!
    fullName: String
    avatarUrl: String
    isActive: Boolean!
    isSuperAdmin: Boolean!
    lastLoginAt: DateTime
    organizations: [UserOrganization!]
    permissions: [String!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Organization Type
  type Organization {
    id: Int!
    name: String!
    slug: String!
    description: String
    logoUrl: String
    isActive: Boolean!
    createdBy: Int!
    settings: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # User Organization Relationship
  type UserOrganization {
    id: Int!
    name: String!
    slug: String!
    description: String
    logoUrl: String
    isDefault: Boolean!
    roleId: Int!
    roleName: String
  }

  # Role Type
  type Role {
    id: Int!
    name: String!
    description: String
    organizationId: Int
    isSystemRole: Boolean!
    permissions: [Permission!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Permission Type
  type Permission {
    id: Int!
    resource: String!
    action: String!
    code: String!
    description: String
  }

  # Auth Response
  type AuthResponse {
    user: User!
    accessToken: String!
    refreshToken: String!
    expiresIn: Int!
  }

  # Token Response
  type TokenResponse {
    accessToken: String!
    refreshToken: String!
    expiresIn: Int!
  }

  # User Permissions Response
  type UserPermissionsResponse {
    permissions: [String!]!
    role: Role
  }

  # Success Response
  type SuccessResponse {
    success: Boolean!
    message: String
  }

  extend type Query {
    # Get current authenticated user
    me: User!

    # Get current user's permissions in the selected organization
    myPermissions: UserPermissionsResponse!

    # Get organization by ID (requires permission)
    organization(id: Int!): Organization

    # Get all organizations for current user
    myOrganizations: [Organization!]!

    # Get all roles in organization
    organizationRoles(organizationId: Int!): [Role!]!

    # Get all permissions
    allPermissions: [Permission!]!

    # Get users in organization (admin only)
    organizationUsers(organizationId: Int!): [OrganizationUser!]!
  }

  extend type Mutation {
    # User Authentication
    login(email: String!, password: String!, organizationId: Int): AuthResponse!
    register(
      email: String!
      username: String!
      password: String!
      fullName: String
      organizationName: String
    ): AuthResponse!
    refreshToken(refreshToken: String!): TokenResponse!
    logout(refreshToken: String!): SuccessResponse!

    # Password Management
    changePassword(
      currentPassword: String!
      newPassword: String!
    ): SuccessResponse!
    resetPasswordRequest(email: String!): SuccessResponse!
    resetPassword(token: String!, newPassword: String!): SuccessResponse!

    # Organization Management
    createOrganization(
      name: String!
      slug: String!
      description: String
      logoUrl: String
    ): Organization!
    updateOrganization(
      id: Int!
      name: String
      description: String
      logoUrl: String
      settings: JSON
    ): Organization!
    deleteOrganization(id: Int!): SuccessResponse!

    # User Management (Admin only)
    inviteUser(
      organizationId: Int!
      email: String!
      roleId: Int!
    ): SuccessResponse!
    updateUserRole(
      userId: Int!
      organizationId: Int!
      roleId: Int!
    ): SuccessResponse!
    removeUserFromOrganization(
      userId: Int!
      organizationId: Int!
    ): SuccessResponse!

    # Role Management (Admin only)
    createCustomRole(
      organizationId: Int!
      name: String!
      description: String
      permissionIds: [Int!]!
    ): Role!
    updateRolePermissions(
      roleId: Int!
      permissionIds: [Int!]!
    ): SuccessResponse!
    deleteRole(roleId: Int!): SuccessResponse!

    # Switch active organization
    switchOrganization(organizationId: Int!): TokenResponse!
  }

  # Organization User (for admin user listing)
  type OrganizationUser {
    id: Int!
    email: String!
    username: String!
    fullName: String
    avatarUrl: String
    isActive: Boolean!
    lastLoginAt: DateTime
    roleId: Int!
    roleName: String!
    joinedAt: DateTime!
    isDefault: Boolean!
  }
`;
