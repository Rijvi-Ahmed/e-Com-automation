import { page, expect } from '@playwright/test';
class SpecificationComparator {

    // Normalize value for comparison (trim, lowercase, remove extra spaces)
    static normalizeValue(value) {
        if (!value) return '';
        return value.toString().trim().toLowerCase().replace(/\s+/g, ' ');
    }

    // Compare two sets of specifications by matching values
    // Since API returns German keys and Frontend returns English keys,
    // we compare by finding matching values instead of matching keys
    static compareSpecifications(frontendSpecs, apiSpecs) {
        if (!frontendSpecs || !apiSpecs) {
            return { mismatches: [], matches: [] };
        }
        
        const mismatches = [];
        const matches = [];
        const frontendKeys = Object.keys(frontendSpecs);
        const apiKeys = Object.keys(apiSpecs);
        const matchedApiKeys = new Set();
        
        console.log(`\nFrontend has ${frontendKeys.length} specs, API has ${apiKeys.length} specs`);
        
        // For each frontend specification, try to find a matching API value
        frontendKeys.forEach(frontendKey => {
            const frontendValue = frontendSpecs[frontendKey];
            const normalizedFrontendValue = this.normalizeValue(frontendValue);
            
            let found = false;
            
            // First, try exact key match (in case keys are the same)
            if (apiSpecs[frontendKey] !== undefined) {
                const apiValue = apiSpecs[frontendKey];
                if (this.normalizeValue(apiValue) === normalizedFrontendValue) {
                    matches.push({ 
                        frontendKey, 
                        apiKey: frontendKey,
                        value: frontendValue 
                    });
                    matchedApiKeys.add(frontendKey);
                    found = true;
                } else {
                    mismatches.push({ 
                        frontendKey, 
                        apiKey: frontendKey,
                        frontendValue, 
                        apiValue 
                    });
                    matchedApiKeys.add(frontendKey);
                    found = true;
                }
            }
            
            // If no exact key match, try to find by matching value
            if (!found) {
                for (const apiKey of apiKeys) {
                    if (matchedApiKeys.has(apiKey)) continue;
                    
                    const apiValue = apiSpecs[apiKey];
                    const normalizedApiValue = this.normalizeValue(apiValue);
                    
                    // Check if values match (exact or partial)
                    if (normalizedFrontendValue === normalizedApiValue ||
                        normalizedFrontendValue.includes(normalizedApiValue) ||
                        normalizedApiValue.includes(normalizedFrontendValue)) {
                        matches.push({ 
                            frontendKey, 
                            apiKey,
                            value: frontendValue 
                        });
                        matchedApiKeys.add(apiKey);
                        found = true;
                        break;
                    }
                }
            }
            
            // If still no match found, report as unmatched frontend spec
            if (!found) {
                mismatches.push({ 
                    frontendKey, 
                    apiKey: '(no matching API key)',
                    frontendValue, 
                    apiValue: '(not found in API)' 
                });
            }
        });
        
        // Check for API specs that weren't matched to any frontend spec
        apiKeys.forEach(apiKey => {
            if (!matchedApiKeys.has(apiKey)) {
                mismatches.push({ 
                    frontendKey: '(no matching frontend key)',
                    apiKey,
                    frontendValue: '(not found on site)', 
                    apiValue: apiSpecs[apiKey] 
                });
            }
        });
    
        return { mismatches, matches };
    }
    

    // Log the results of comparison
    static logResults(mismatches, matches) {
        if (matches.length > 0) {
            console.log(`\n✓ Matches found (${matches.length}):`);
            for (const match of matches) {
                console.log(`  - [Site: "${match.frontendKey}"] = [API: "${match.apiKey}"] => "${match.value}"`);
            }
        }

        if (mismatches.length > 0) {
            console.log(`\n✗ Mismatches found (${mismatches.length}):`);
            for (const mismatch of mismatches) {
                console.log(`  - [Site: "${mismatch.frontendKey}"] vs [API: "${mismatch.apiKey}"]`);
                console.log(`    Site Value: "${mismatch.frontendValue}"`);
                console.log(`    API Value:  "${mismatch.apiValue}"`);
            }
        }
        
        if (matches.length === 0 && mismatches.length === 0) {
            console.log('\nNo specifications to compare.');
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

// Export the class as default
module.exports = SpecificationComparator;

// Also export individual functions for named imports
module.exports.compareSpecifications = SpecificationComparator.compareSpecifications.bind(SpecificationComparator);
module.exports.logResults = SpecificationComparator.logResults.bind(SpecificationComparator);
module.exports.compareSpecificationsAcrossProducts = SpecificationComparator.compareSpecificationsAcrossProducts.bind(SpecificationComparator);
module.exports.compareandconsolidatedSpecsAcrossProducts = SpecificationComparator.compareandconsolidatedSpecsAcrossProducts.bind(SpecificationComparator);
module.exports.sortValues = SpecificationComparator.sortValues.bind(SpecificationComparator);
