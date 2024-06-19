const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// External API base URL
const EXTERNAL_API_URL = 'http://20.244.56.144/test';

// Middleware to parse JSON bodies
app.use(express.json());

// Route to handle registration
app.post('/register', async (req, res) => {
    const { companyName, ownerName, rollNo, ownerEmail, accessCode } = req.body;

    try {
        const registerResponse = await axios.post(`${EXTERNAL_API_URL}/register`, {
            companyName,
            ownerName,
            rollNo,
            ownerEmail,
            accessCode
        });
        res.json(registerResponse.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to handle authentication
app.post('/auth', async (req, res) => {
    const { companyName, clientId, clientSecret, ownerName, ownerEmail, rollNo } = req.body;

    try {
        const authResponse = await axios.post(`${EXTERNAL_API_URL}/auth`, {
            companyName,
            clientId,
            clientSecret,
            ownerName,
            ownerEmail,
            rollNo
        });
        res.json(authResponse.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to fetch products by category with optional filters and pagination
app.get('/categories/:categoryname/products', async (req, res) => {
    const { categoryname } = req.params;
    const { top, minPrice, maxPrice, sort, order, page } = req.query;

    try {
        const companyCodes = ['AMZ', 'FLP', 'SNP', 'BIYN', 'AZO'];
        const productRequests = companyCodes.map(companyCode => 
            axios.get(`${EXTERNAL_API_URL}/companies/${companyCode}/categories/${categoryname}/products`, {
                params: { top, minPrice, maxPrice }
            })
        );

        const productResponses = await Promise.all(productRequests);
        let allProducts = productResponses.flatMap(response => response.data);

        // Sorting logic
        if (sort && order) {
            allProducts.sort((a, b) => {
                if (order === 'asc') {
                    return a[sort] > b[sort] ? 1 : -1;
                } else {
                    return a[sort] < b[sort] ? 1 : -1;
                }
            });
        }

        // Pagination logic
        const itemsPerPage = Math.min(parseInt(top) || 10, 10);
        const currentPage = parseInt(page) || 1;
        const paginatedProducts = allProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

        res.json(paginatedProducts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to fetch a product by ID
app.get('/products/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const companyCodes = ['AMZ', 'FLP', 'SNP', 'BIYN', 'AZO'];
        
        for (const companyCode of companyCodes) {
            try {
                const productResponse = await axios.get(`${EXTERNAL_API_URL}/companies/${companyCode}/categories/Laptop/products`);
                const product = productResponse.data.find(product => product.id === id);

                if (product) {
                    return res.json(product);
                }
            } catch (error) {
                // Continue to the next company if the current one fails
                continue;
            }
        }

        res.status(404).json({ error: 'Product not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
