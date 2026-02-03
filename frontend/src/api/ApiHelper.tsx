/* eslint-disable @typescript-eslint/no-explicit-any */
import Axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type AxiosRequestConfig,
} from 'axios';

const axiosApiInstance: AxiosInstance = Axios.create();

const handleError = async (error?: AxiosError): Promise<void> => {
  if (error) {
    console.error(error);
  } else {
    console.error('Cannot load data! Please check your internet connection');
  }
};

const ApiHelper = {
  // Api get function
  get: async (url: string): Promise<AxiosResponse | undefined> => {
    try {
      return await axiosApiInstance.get(url);
    } catch (error) {
      if (Axios.isAxiosError(error)) {
        await handleError(error);
        return error.response;
      } else {
        await handleError();
        return undefined;
      }
    }
  },

  // get with headers
  getWithHeaders: async (
    url: string,
    headers: AxiosRequestConfig['headers']
  ): Promise<AxiosResponse | undefined> => {
    try {
      return await axiosApiInstance.get(url, { headers });
    } catch (error) {
      if (Axios.isAxiosError(error)) {
        await handleError(error);
        return error.response;
      } else {
        await handleError();
        return undefined;
      }
    }
  },

  // get with headers and data
  getWithHeadersAndData: async (
    url: string,
    headers: AxiosRequestConfig['headers'],
    data?: any
  ): Promise<AxiosResponse | undefined> => {
    try {
      return await axiosApiInstance.get(url, { headers, data });
    } catch (error) {
      if (Axios.isAxiosError(error)) {
        await handleError(error);
        return error.response;
      } else {
        await handleError();
        return undefined;
      }
    }
  },

  // post with both header and data
  postWithHeaders: async (
    url: string,
    headers: AxiosRequestConfig['headers'],
    data?: any
  ): Promise<AxiosResponse | undefined> => {
    try {
      return await axiosApiInstance.post(url, data, { headers });
    } catch (error) {
      if (Axios.isAxiosError(error)) {
        await handleError(error);
        return error.response;
      } else {
        await handleError();
        return undefined;
      }
    }
  },

  // post with header only
  postWithOnlyHeaders: async (
    url: string,
    headers: AxiosRequestConfig['headers']
  ): Promise<AxiosResponse | undefined> => {
    try {
      return await axiosApiInstance.post(url, {}, { headers });
    } catch (error) {
      if (Axios.isAxiosError(error)) {
        await handleError(error);
        return error.response;
      } else {
        await handleError();
        return undefined;
      }
    }
  },

  // Api post function
  post: async (url: string, data?: any): Promise<AxiosResponse | undefined> => {
    try {
      return await axiosApiInstance.post(url, data);
    } catch (error) {
      if (Axios.isAxiosError(error)) {
        await handleError(error);
        return error.response;
      } else {
        await handleError();
        return undefined;
      }
    }
  },

  // Api put function
  put: async (url: string, data?: any): Promise<AxiosResponse | undefined> => {
    try {
      return await axiosApiInstance.put(url, data);
    } catch (error) {
      if (Axios.isAxiosError(error)) {
        await handleError(error);
        return error.response;
      } else {
        await handleError();
        return undefined;
      }
    }
  },

  // put with headers
  putWithHeaders: async (
    url: string,
    headers: AxiosRequestConfig['headers'],
    data?: any
  ): Promise<AxiosResponse | undefined> => {
    try {
      return await axiosApiInstance.put(url, data, { headers });
    } catch (error) {
      if (Axios.isAxiosError(error)) {
        await handleError(error);
        return error.response;
      } else {
        await handleError();
        return undefined;
      }
    }
  },

  // Api delete function
  delete: async (url: string): Promise<AxiosResponse | undefined> => {
    try {
      return await axiosApiInstance.delete(url);
    } catch (error) {
      if (Axios.isAxiosError(error)) {
        await handleError(error);
        return error.response;
      } else {
        await handleError();
        return undefined;
      }
    }
  },

  // put with headers
  deleteWithHeaders: async (
    url: string,
    headers: AxiosRequestConfig['headers']
  ): Promise<AxiosResponse | undefined> => {
    try {
      return await axiosApiInstance.delete(url, { headers });
    } catch (error) {
      if (Axios.isAxiosError(error)) {
        await handleError(error);
        return error.response;
      } else {
        await handleError();
        return undefined;
      }
    }
  },
};

export default ApiHelper;
