import { page, expect } from '@playwright/test';
class SpecificationComparator {

    // Compare two sets of specifications
    static compareSpecifications(frontendSpecs, apiSpecs) {
        const mismatches = [];
        const matches = [];

        Object.keys(apiSpecs).forEach(key => {
            const apiValue = apiSpecs[key];
            const frontendValue = frontendSpecs[key];

            if (frontendValue === apiValue) {
                expect(frontendValue).toBe(apiValue);
                matches.push({ key, value: apiValue });
            } else {
                mismatches.push({ key, apiValue, frontendValue });
            }
        });

        return { mismatches, matches };
    }

    // Log the results of comparison
    static logResults(mismatches, matches) {
        if (matches.length > 0) {
            console.log(`Matches found:`);
            for (const match of matches) {
                console.log(`- ${match.key}: ${match.value}`);
            }
        }

        if (mismatches.length > 0) {
            console.log(`Mismatches found:`);
            for (const mismatch of mismatches) {
                console.log(`- ${mismatch.key}: Site Value: ${mismatch.frontendValue}, API Value: ${mismatch.apiValue}`);
                console.log("\n");
            }
        }
    }

    static compareSpecificationsAcrossProducts(productSpecifications) {
        const uniqueSpecifications = {};

        // Step 1: Get all the specification keys from all products
        const allSpecificationKeys = new Set();
        for (const productId in productSpecifications) {
            const specs = productSpecifications[productId];
           // console.log(`Specifications for product ${productId}:`, specs); // Debugging log

            if (specs && Object.keys(specs).length > 0) {
                Object.keys(specs).forEach(key => allSpecificationKeys.add(key));
            }
        }

        // Step 2: Initialize uniqueSpecifications for each product
        for (const productId in productSpecifications) {
            uniqueSpecifications[productId] = {};
        }

        // Step 3: Loop through each specification key and compare between products
        allSpecificationKeys.forEach(specKey => {
            const specValues = new Set();
            let isCommon = true;
            let firstValue = null;

            // Compare spec values for this key across all products
            for (const productId in productSpecifications) {
                const specValue = productSpecifications[productId][specKey] || null;
                //console.log(`Comparing ${specKey} for product ${productId}: ${specValue}`); // Debugging log

                if (firstValue === null) {
                    firstValue = specValue;
                } else if (specValue !== firstValue) {
                    isCommon = false;
                }

                specValues.add(specValue);
            }

            // If the spec key has different values across products, it's unique for each
            if (!isCommon) {
                for (const productId in productSpecifications) {
                    const specValue = productSpecifications[productId][specKey];
                    if (specValue) {
                        uniqueSpecifications[productId][specKey] = specValue;
                    }
                }
            }
        });

       // console.log('Unique Specifications:', uniqueSpecifications); // Debugging log
        // Return the unique specifications as the mismatches result
        return uniqueSpecifications ;
    }

    static compareandconsolidatedSpecsAcrossProducts(allFrontendSpecifications) {
        const consolidatedSpecs = {};
    
        // Loop through each product and its specifications
        for (const [productId, specifications] of Object.entries(allFrontendSpecifications)) {
            for (const [specKey, specValue] of Object.entries(specifications)) {
                // If the specification key already exists in the consolidated specs, add unique values
                if (consolidatedSpecs[specKey]) {
                    consolidatedSpecs[specKey].push(specValue);
                } else {
                    // Initialize an array to store values for this specification
                    consolidatedSpecs[specKey] = [specValue];
                }
            }
        }
    
        // For each specification, remove duplicate values
        for (const [specKey, specValues] of Object.entries(consolidatedSpecs)) {
            // Flatten the array in case specValues are comma-separated strings, and remove duplicates
            const flattenedValues = specValues.flatMap(value => value.split(',').map(v => v.trim()));
    
            // Use a Set to remove duplicates and convert it back to a unique array
            const uniqueValues = Array.from(new Set(flattenedValues));
    
            // If the array has only one value, convert it to a string; otherwise, keep it as a comma-separated list
            consolidatedSpecs[specKey] = uniqueValues.length === 1 ? uniqueValues[0] : uniqueValues.join(', ');
        }
    
        return consolidatedSpecs;
    }
    
    // Helper function to split, sort, and join values
    static sortValues(value) {
        if (typeof value === 'string' && value.includes(',')) {
            // Split the string by commas, trim each value, and sort alphabetically
            return value.split(',').map(v => v.trim()).sort().join(', ');
        }
        return value;
    }

}

module.exports = SpecificationComparator;
