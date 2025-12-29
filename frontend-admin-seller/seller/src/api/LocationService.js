import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const LOCATION_ENDPOINT = `${API_URL}/seller/addresses`;

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
      const res = await axios.get(LOCATION_ENDPOINT, {
        withCredentials: true,
      });

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
      const params = new URLSearchParams();
      params.append("is_default", isDefault);
      if (label) params.append("label", label);

      const res = await axios.post(
        `${LOCATION_ENDPOINT}/create-and-link?${params.toString()}`,
        addressData,
        { withCredentials: true }
      );

      return res.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  /* UPDATE LINK */
  async updateAddressLink(sellerAddressId, linkData) {
    try {
      const res = await axios.patch(
        `${LOCATION_ENDPOINT}/${sellerAddressId}`,
        linkData,
        { withCredentials: true }
      );
      return res.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  /* UPDATE CONTENT */
  async updateAddressContent(sellerAddressId, addressData) {
    try {
      const res = await axios.patch(
        `${LOCATION_ENDPOINT}/${sellerAddressId}/address`,
        addressData,
        { withCredentials: true }
      );
      return res.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  /* SET DEFAULT */
  async setDefaultAddress(sellerAddressId) {
    try {
      const res = await axios.patch(
        `${LOCATION_ENDPOINT}/${sellerAddressId}/default`,
        {},
        { withCredentials: true }
      );
      return res.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },

  /* DELETE */
  async deleteAddress(sellerAddressId) {
    try {
      const res = await axios.delete(
        `${LOCATION_ENDPOINT}/${sellerAddressId}`,
        { withCredentials: true }
      );
      return res.data;
    } catch (error) {
      handleAxiosError(error);
    }
  },
};

export default locationService;
