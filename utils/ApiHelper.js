import { Page } from '@playwright/test';
class ApiHelper {
    constructor(page) {
        this.page = page;
        this.apiBaseUrl = process.env.API_BASE_URL;
        this.apiQueryParams = process.env.API_QUERY_PARAMS;
    }

    
    async getApiSpecifications(productId) {
        const base64ProductId = `hbk_${Buffer.from(productId).toString('base64')}`;
        const apiUrl = `${this.apiBaseUrl}${base64ProductId}${this.apiQueryParams}`;

        // Use the fetchWithRetry function to get the API response
        const responseBody = await this.fetchWithRetry(apiUrl);

        if (!responseBody) {
            console.error(`Failed to retrieve data for Product ID: ${productId}`);
            return null;
        }
        const apiSpecifications = {};

        // Check if classifications exist in the product data
        if (responseBody.classifications && responseBody.classifications.length > 0) {
           //console.log('Classifications found:');
            responseBody.classifications.forEach(classification => {

                // Iterate over features for each classification
                classification.features.forEach(feature => {
                    if (!feature.code.includes('_raw')) {
                        // Store feature and value in a dictionary for easier comparison
                        apiSpecifications[feature.name] = feature.featureValues.map(fv => fv.value).join(', ');
                    }
                });
            });
        } else {
            // If no classifications exist
            console.log('No classifications found for this product.');
        }

        return apiSpecifications;
    }

    // Function to get API specifications with the first classification
    async getApiSpecificationswithfirstclassification(productId) {
        const base64ProductId = `hbk_${Buffer.from(productId).toString('base64')}`;  // Convert the productId to base64
        const apiUrl = `${this.apiBaseUrl}${base64ProductId}${this.apiQueryParams}`;

            // Use the fetchWithRetry function to get the API response
            const responseBody = await this.fetchWithRetry(apiUrl);

            if (!responseBody) {
                console.error(`Failed to retrieve data for Product ID: ${productId}`);
                return null;
            }

            const apiSpecificationswithfirstclassification = {};

            // Check if classifications exist in the API response
            if (responseBody.classifications && responseBody.classifications.length > 0) {
                // Get the first classification
                const firstClassification = responseBody.classifications[0];

                if (firstClassification && firstClassification.features) {
                    // Iterate through features and add them to apiSpecificationswithfirstclassification
                    firstClassification.features.forEach(feature => {
                        // Add all feature values to apiSpecifications
                        if (!feature.code.includes('_raw')) {
                            apiSpecificationswithfirstclassification[feature.name] = feature.featureValues.map(fv => fv.value).join(', ');
                       }

                    });
                }
            }else {
                // If no classifications exist
                console.log('No classifications found for this product.');
            }

            return apiSpecificationswithfirstclassification;  // Return the constructed specification object
    }

    async fetchWithRetry(apiUrl, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await this.page.request.get(apiUrl, {
                    headers: {
                        'accept': 'application/json',
                    },
                    timeout: 200000
                });
                if (response.status() === 200) {
                    return await response.json();
                } else {
                    console.error(`Request failed with status ${response.status()}`);
                }
            } catch (error) {
                if (i === retries - 1) {
                    throw error;
                }
                console.log(`Retrying... Attempt ${i + 1} of ${retries}`);
            }
        }
    }


}

module.exports = ApiHelper;
