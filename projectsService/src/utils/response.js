// src/utils/response.js
// Standardized API response format

export class CustomResponse {
  constructor() {
    this.status = 'SUCCESS';
    this.message = '';
    this.data = null;
  }
}
