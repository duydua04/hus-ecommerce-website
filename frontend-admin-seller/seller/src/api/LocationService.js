// api/locationService.js
import axiosInstance from "../utils/axiosConfig";

const LOCATION_ENDPOINT = "/seller/addresses";

const handleAxiosError = (error) => {
  if (error.response) {
    throw {
      detail: error.response.data?.detail,
      status: error.response.status,
    };
  }

  if (error.request) {
    throw { detail: "Không thể kết nối đến server" };
  }

  throw { detail: error.message };
};

const locationService = {
  /* GET */
  async getAddresses() {
    try {
      const res = await axiosInstance.get(LOCATION_ENDPOINT);

      if (Array.isArray(res.data)) return res.data;
      if (res.data?.addresses) return res.data.addresses;
      if (res.data?.data) return res.data.data;

      return [];
    } catch (error) {
      handleAxiosError(error);
    }
  },

  /* CREATE */
  async createAddress(addressData, isDefault = false, label = null) {
    try {
      const params = { is_default: isDefault };
      if (label) params.label = label;

      const res = await axiosInstance.post(
        `${LOCATION_ENDPOINT}/create-and-link`,
        addressData,
        { params }
      );

      return res.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  /* UPDATE LINK */
  async updateAddressLink(sellerAddressId, linkData) {
    try {
      const res = await axiosInstance.patch(
        `${LOCATION_ENDPOINT}/${sellerAddressId}`,
        linkData
      );
      return res.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  /* UPDATE CONTENT */
  async updateAddressContent(sellerAddressId, addressData) {
    try {
      const res = await axiosInstance.patch(
        `${LOCATION_ENDPOINT}/${sellerAddressId}/address`,
        addressData
      );
      return res.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  /* SET DEFAULT */
  async setDefaultAddress(sellerAddressId) {
    try {
      const res = await axiosInstance.patch(
        `${LOCATION_ENDPOINT}/${sellerAddressId}/default`,
        {}
      );
      return res.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  /* DELETE */
  async deleteAddress(sellerAddressId) {
    try {
      const res = await axiosInstance.delete(
        `${LOCATION_ENDPOINT}/${sellerAddressId}`
      );
      return res.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },
};

export default locationService;
