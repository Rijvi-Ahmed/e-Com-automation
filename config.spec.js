require('dotenv').config(); // Load environment variables
import { mergeBaseUrlWithChildUrl } from './utils/urlHelper.spec';

const baseUrl = process.env.URL; // Example: https://dev.hbkworld.com/en
const childUrl = 'qa-base/e-com-automation/e-com_overview/e-com_listing/e-com_product';

const fullUrl = mergeBaseUrlWithChildUrl(baseUrl, childUrl);

export default { fullUrl };