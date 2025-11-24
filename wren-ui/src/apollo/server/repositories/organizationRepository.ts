import { Knex } from "knex";

export interface IOrganization {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  isActive: boolean;
  createdBy: number;
  settings?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateOrganizationInput {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  createdBy: number;
  settings?: any;
}

export interface IUpdateOrganizationInput {
  name?: string;
  description?: string;
  logoUrl?: string;
  isActive?: boolean;
  settings?: any;
}

export default class OrganizationRepository {
  constructor(private knex: Knex) {}

  private toEntity(row: any): IOrganization {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      logoUrl: row.logo_url,
      isActive: row.is_active,
      createdBy: row.created_by,
      settings: row.settings,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public async createOrganization(
    input: ICreateOrganizationInput,
  ): Promise<IOrganization> {
    const [row] = await this.knex("organizations")
      .insert({
        name: input.name,
        slug: input.slug,
        description: input.description,
        logo_url: input.logoUrl,
        created_by: input.createdBy,
        settings: input.settings ? JSON.stringify(input.settings) : null,
        is_active: true,
      })
      .returning("*");

    return this.toEntity(row);
  }

  public async findOrganizationById(id: number): Promise<IOrganization | null> {
    const row = await this.knex("organizations").where({ id }).first();
    return row ? this.toEntity(row) : null;
  }

  public async findOrganizationBySlug(
    slug: string,
  ): Promise<IOrganization | null> {
    const row = await this.knex("organizations").where({ slug }).first();
    return row ? this.toEntity(row) : null;
  }

  public async updateOrganization(
    id: number,
    input: IUpdateOrganizationInput,
  ): Promise<IOrganization> {
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.logoUrl !== undefined) updateData.logo_url = input.logoUrl;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;
    if (input.settings !== undefined) {
      updateData.settings = JSON.stringify(input.settings);
    }

    const [row] = await this.knex("organizations")
      .where({ id })
      .update(updateData)
      .returning("*");

    return this.toEntity(row);
  }

  public async deleteOrganization(id: number): Promise<void> {
    await this.knex("organizations").where({ id }).delete();
  }

  public async listOrganizations(options?: {
    limit?: number;
    offset?: number;
    isActive?: boolean;
  }): Promise<{ organizations: IOrganization[]; total: number }> {
    let query = this.knex("organizations");

    if (options?.isActive !== undefined) {
      query = query.where({ is_active: options.isActive });
    }

    const [{ count }] = await query.clone().count("* as count");
    const total = Number(count);

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    const rows = await query.select("*").orderBy("created_at", "desc");
    const organizations = rows.map(this.toEntity);

    return { organizations, total };
  }

  public async getUserOrganizations(userId: number): Promise<IOrganization[]> {
    const rows = await this.knex("organizations")
      .join(
        "user_organizations",
        "organizations.id",
        "user_organizations.organization_id",
      )
      .where("user_organizations.user_id", userId)
      .where("organizations.is_active", true)
      .select("organizations.*")
      .orderBy("user_organizations.is_default", "desc")
      .orderBy("organizations.created_at", "desc");

    return rows.map(this.toEntity);
  }
}
