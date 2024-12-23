import { Controller, Get, Post, Put, Delete, Route, Tags, Body, Response, Security, Request, Path } from "tsoa";
import prisma from "../config/prisma.config";
import isValidInt from "../helper/validations";
import { addressMapper } from "../helper/backwardMapper";
import { _AddressType } from "../types/backwardCompatibility.types";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

interface CreateSettingRequest {
  key: string;
  value: string;
}

interface CreateSettingResponse {
  id: string,
  key: string;
  value: string;
  userId: string
}

interface UpdateSettingRequest {
  value: string;
}

interface CreatedAddressResponse {
  message: string;
  address?: _AddressType;
}

@Route("user")
@Tags("User")
@Security("jwt")
export class UserController extends Controller {
  /**
   * Update the user's profile settings.
   * @param userId The user's ID from the authentication token.
   * @param body The updated profile data (name and/or email).
   * @returns The updated profile.
   */
  @Put("/")
  @Response(400, "Invalid inputs")
  public async updateProfile(
    @Request() req: any, 
    @Body() body: UpdateProfileRequest
): Promise<{ 
    message: string; 
    updatedProfile: UserProfile 
}> {
    const { name, email } = body;

    // Prepare data for upsert
    const data = [
      { key: "name", value: name },
      { key: "email", value: email },
    ].filter((item) => item.value !== undefined);

    // Perform upsert operations
    for (const item of data) {
      await prisma.userSettingsModel.upsert({
        where: {
          userId_settingsKey: {
            userId: req.user.id,
            settingsKey: item.key,
          },
        },
        update: { settingsValue: item.value },
        create: { userId: req.user.id, settingsKey: item.key, settingsValue: item.value ? item.value : '' },
      });
    }

    // Retrieve updated settings
    const settings = await prisma.userSettingsModel.findMany({ where: { userId: req.user.id } });

    // Transform settings into a key-value object
    const userProfile = settings.reduce((profile: any, setting: any) => {
      profile[setting.settingsKey] = setting.settingsValue;
      return profile;
    }, {});

    // Create the filtered profile object
    const filteredProfile: UserProfile = {
      id: req.user.id,
      name: userProfile["name"] || "",
      email: userProfile["email"] || "",
      phone: userProfile["phone"] || "",
    };

    return { message: "success", updatedProfile: filteredProfile };
  }

  /**
   * Get the user's profile settings.
   * @param userId The user's ID from the authentication token.
   * @returns The user's profile.
   */
  @Get("/")
  public async getProfile(@Request() req: any): Promise<UserProfile> {
    // Retrieve settings for the user
    const settings = await prisma.userSettingsModel.findMany({ where: { userId: req.user.id } });

    // Transform settings into a key-value object
    const userProfile = settings.reduce((profile: any, setting: any) => {
      profile[setting.settingsKey] = setting.settingsValue;
      return profile;
    }, {});

    // Create the filtered profile object
    return {
      id: req.user.id,
      name: userProfile["name"] || "",
      email: userProfile["email"] || "",
      phone: userProfile["phone"] || "",
    };
  }

  /**
   * Retrieve all user settings.
   * @param userId The user's ID from the authentication token.
   * @returns An array of user settings.
   */
  @Get("/settings")
  public async getUserSettings(@Request() req: any): Promise<CreateSettingResponse[]> {
    const settings = await prisma.userSettingsModel.findMany({
      where: { userId: req.user.id },
    });
    return settings.map((setting) => ({
      id: setting.id,
      key: setting.settingsKey,
      value: setting.settingsValue,
      userId: setting.userId
    }));
  }

  /**
   * Create a new user setting.
   * @param userId The user's ID from the authentication token.
   * @param body The key and value of the setting.
   * @returns A success message.
   */
  @Post("/settings")
  @Response(201, "Settings created")
  @Response(400, "Invalid inputs")
  public async createUserSetting(
    @Request() req: any, 
    @Body() body: CreateSettingRequest
): Promise<{ message: string }> {
    const { key, value } = body;

    if (key === null || key === undefined || (typeof key === "string" && value.trim().length === 0) || typeof value === "number") {
      this.setStatus(400);
      return { message: "invalid-inputs" };
    }

    if (value === null || value === undefined || (typeof value === "string" && value.trim().length === 0) || (typeof value === "number" && isNaN(value))) {
      this.setStatus(400);
      return { message: "invalid-inputs" };
    }

    await prisma.userSettingsModel.create({
      data: {
        userId: req.user.id,
        settingsKey: key,
        settingsValue: value,
      },
    });

    return { message: "success" };
  }

  /**
   * Update an existing user setting.
   * @param userId The user's ID from the authentication token.
   * @param key The key of the setting to update.
   * @param body The updated value.
   * @returns A success message or an error if the setting is not found.
   */
  @Put("/settings/{key}")
  @Response(404, "Setting not found")
  public async updateUserSetting(@Request() req: any, @Path() key: string, @Body() body: UpdateSettingRequest): Promise<{ message: string }> {
    const { value } = body;

    if (value === null || value === undefined || (typeof value === "string" && value.trim().length === 0) || (typeof value === "number" && isNaN(value))) {
      this.setStatus(400);
      return { message: "invalid-inputs" };
    }

    return await prisma.userSettingsModel.update({
      where: {
        userId_settingsKey: { 
          userId: req.user.id, 
          settingsKey: key 
        },
      },
      data: { settingsValue: value },
    }).then((a) => {
      if(a){
        return { message: "success" }
      } 
      return { message: 'failed' }

    }).catch((e) => {
      return { message: "not-found" } 
    });
  }

  /**
   * Delete a user setting.
   * @param userId The user's ID from the authentication token.
   * @param key The key of the setting to delete.
   * @returns A success message or an error if the setting is not found.
   */
  @Delete("/settings/{key}")
  @Response(404, "Setting not found")
  public async deleteUserSetting(@Request() req: any, @Path() key: string): Promise<{ message: string }> {
    const deleted = await prisma.userSettingsModel.deleteMany({
      where: {
        userId: req.user.id,
        settingsKey: key,
      },
    });

    if (deleted.count === 0) {
      this.setStatus(404);
      return { message: "not-found" };
    }

    return { message: "success" };
  }

  /**
   * Get all user addresses.
   * @param userId The user's ID from the authentication token.
   * @returns An array of user addresses.
   */
  @Get("/address")
  public async getUserAddresses(@Request() req: any): Promise<_AddressType[]> {
    const _add = await prisma.userAddressModel.findMany({
      where: { userId: req.user.id },
    });

    const address = _add.map((a) => addressMapper(a))
    return address
  }

  /**
   * Get a specific user address by ID.
   * @param id The address ID.
   * @returns The address or an error if not found.
   */
  @Get("/address/{id}")
  @Response(404, "Address not found")
  public async getUserAddressById(@Path() id: string, @Request() req: any): Promise<{ message: string; address?: _AddressType }> {
    try {
      const a = await prisma.userAddressModel.findUnique({
        where: { id, userId: req.user.id },
      });
  
      if (!a) {
        return { message: "not-found" };
      }

      const address = addressMapper(a)
  
      return { message: "success", address };
    } catch (e) {
      return { message: "not-found" };
    }
  }

  /**
   * Delete a user address by ID.
   * @param id The address ID.
   * @param userId The user's ID from the authentication token.
   * @returns A success message or an error if the address is not found.
   */
  @Delete("/address/{id}")
  @Response(404, "Address not found")
  public async deleteUserAddress(
    @Path() id: string, 
    @Request() req: any
  ): Promise<{ message: string; address?: _AddressType }> {

    return await prisma.userAddressModel.delete({
      where: { id, userId: req.user.id },

    }).then((a) => { 
      const address = addressMapper(a)
      return { message: "success", address }

    }).catch((e) => {
      return { message: "not-found" } 
    });
  }

  /**
   * Create a new user address.
   * @param userId The user's ID from the authentication token.
   * @param body The address details.
   * @returns A success message and the created address.
   */
  @Post("/address")
  @Response(201, "Address created")
  @Response(400, "Missing or invalid inputs")
  public async createUserAddress(
    @Request() req: any,
    @Body() body: _AddressType
  ): Promise<CreatedAddressResponse> {
    const {
      address_line1,
      address_line2,
      street,
      city,
      state,
      country,
      latitude,
      longitude,
      addressType,
      landmark,
      postalCode,
    } = body;

    // Validate inputs
    if (
      !address_line1 ||
      !state ||
      !city ||
      !isValidInt(postalCode)
    ) {
      this.setStatus(400);
      return { message: 'invalid-inputs' }
    }

    const settings = await prisma.userSettingsModel.findMany({
      where: {
        userId: req.user.id,
        settingsKey: { in: ["phone", "name"] },
      },
    });

    const phone = settings.find((setting) => setting.settingsKey === "phone");
    const name = settings.find((setting) => setting.settingsKey === "name");

    if (!phone) {
      this.setStatus(400);
      return { message: 'no-phonenumber-fail' }
    }

    const a = await prisma.userAddressModel.create({
      data: {
        userId: req.user.id,
        addressLine1: address_line1,
        addressLine2: address_line2 ? address_line2 : '',
        addressStreet: street ? street : '',
        addressCity: city,
        addressState: state,
        addressCountry: country,
        addressLatitude: latitude,
        addressLongitude: longitude,
        addressAddressType: addressType ? addressType : 'home',
        addressLandmark: landmark ? landmark : '',
        addressPostalCode: parseInt(postalCode),
        addressContactName: name ? name.settingsValue : "trendsetter",
        addressContactPhone: phone.settingsValue,
      },
    });

      const address = addressMapper(a)
      return { message: "success", address };
  }
}