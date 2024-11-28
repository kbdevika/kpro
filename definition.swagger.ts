/**
 * Swagger Version 1 (V1)
 */

// Authentication
/**
 * @swagger
 * /auth/truecaller:
 *   post:
 *     summary: Authenticate user via Truecaller token
 *     description: Authenticate the user using a token from Truecaller and provide a JWT.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: The Truecaller token to authenticate.
 *     responses:
 *       200:
 *         description: Successful authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                   description: The JWT token for accessing the API.
 *                 token_type:
 *                   type: string
 *                   example: bearer
 *       500:
 *         description: Internal server error
 */


/**
 * User Settings
 */

// Fetch User Settings
/**
 * @swagger
 * /user/settings:
 *   get:
 *     summary: Get user settings
 *     description: Retrieve all settings for the authenticated user.
 *     tags:
 *       - User Settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of user settings.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "1"
 *                   userId:
 *                     type: string
 *                     example: "user_123"
 *                   key:
 *                     type: string
 *                     example: "name"
 *                   value:
 *                     type: string
 *                     example: "Jon Doe"
 *       401:
 *         description: Authentication error.
 *       500:
 *         description: Internal server error.
 */

// Create User Settings 
/**
 * @swagger
 * /user/settings:
 *   post:
 *     summary: Create a new user setting
 *     description: Add a new setting for the authenticated user.
 *     tags:
 *       - User Settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *                 example: "theme"
 *               value:
 *                 type: string
 *                 example: "dark"
 *     responses:
 *       200:
 *         description: Setting created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Setting created successfully"
 *       401:
 *         description: Authentication error.
 *       500:
 *         description: Internal server error.
 */

// Update User Settings
/**
 * @swagger
 * /user/settings/{key}:
 *   put:
 *     summary: Update an existing user setting
 *     description: Update a setting for the authenticated user based on the key.
 *     tags:
 *       - User Settings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: key
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The key of the setting to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *                 example: "light"
 *     responses:
 *       200:
 *         description: Setting updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Setting updated successfully"
 *       401:
 *         description: Authentication error.
 *       404:
 *         description: Setting not found.
 *       500:
 *         description: Internal server error.
 */

// Delete User Settings
/**
 * @swagger
 * /user/settings/{key}:
 *   delete:
 *     summary: Delete a user setting
 *     description: Delete a specific setting for the authenticated user based on the key.
 *     tags:
 *       - User Settings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: key
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The key of the setting to delete.
 *     responses:
 *       200:
 *         description: Setting deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Setting deleted successfully"
 *       401:
 *         description: Authentication error.
 *       404:
 *         description: Setting not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * Profile Routes
 */

// Create User Profile
/**
 * @swagger
 * /user:
 *   post:
 *     summary: Create user settings as key-value pairs
 *     description: Creates user settings such as name, email, and phone as individual key-value pairs in the database. If the user already has a profile, an error is returned.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: [] # Use token-based authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john.doe@example.com
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *             required:
 *               - name
 *               - email
 *               - phone
 *     responses:
 *       201:
 *         description: User settings created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Settings created successfully
 *       400:
 *         description: Bad Request - User profile already exists or invalid input data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: User profile already exists
 *       401:
 *         description: Unauthorized - Token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal Server Error - An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */

// Update User Profile
/**
 * @swagger
 * /user:
 *   put:
 *     summary: Update user profile
 *     description: Updates the user's profile settings such as name, email, and phone. If the keys already exist, their values are updated.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: [] # Token-based authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The user's name.
 *                 example: user
 *               email:
 *                 type: string
 *                 description: The user's email address.
 *                 example: user@website.com
 *               phone:
 *                 type: string
 *                 description: The user's phone number.
 *                 example: +919999999999
 *     responses:
 *       201:
 *         description: User profile updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Settings updated successfully
 *       400:
 *         description: Bad request - Invalid or missing request body.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */

// Fetch User Profile
/**
 * @swagger
 * /user:
 *   get:
 *     summary: Fetch user profile
 *     description: Retrieves user profile information such as name, email, and phone in a structured format.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: [] # Use token-based authentication
 *     responses:
 *       200:
 *         description: User profile retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: user
 *                 email:
 *                   type: string
 *                   example: user@website.com
 *                 phone:
 *                   type: string
 *                   example: +919999999999
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal Server Error - An error occurred while processing the request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */

/**
 * Address Routes
 */

// Fetch Address
/**
 * @swagger
 * /user/address:
 *   get:
 *     summary: Get all addresses for the authenticated user
 *     description: Retrieves a list of all addresses associated with the authenticated user.
 *     tags:
 *       - User Address
 *     security:
 *       - bearerAuth: [] # Use token-based authentication
 *     responses:
 *       200:
 *         description: Successfully retrieved user addresses.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The unique ID of the address.
 *                     example: "c1234567-89ab-cdef-0123-456789abcdef"
 *                   userId:
 *                     type: string
 *                     description: The ID of the user who owns the address.
 *                     example: "u1234567-89ab-cdef-0123-456789abcdef"
 *                   address_line1:
 *                     type: string
 *                     description: The first line of the address.
 *                     example: "123 Main Street"
 *                   address_line2:
 *                     type: string
 *                     description: The second line of the address (optional).
 *                     example: "Apartment 4B"
 *                   street:
 *                     type: string
 *                     description: The street name.
 *                     example: "Central Park Road"
 *                   city:
 *                     type: string
 *                     description: The city name.
 *                     example: "New York"
 *                   state:
 *                     type: string
 *                     description: The state name.
 *                     example: "NY"
 *                   country:
 *                     type: string
 *                     description: The country name.
 *                     example: "USA"
 *                   latitude:
 *                     type: number
 *                     description: The latitude of the address (optional).
 *                     example: 40.712776
 *                   longitude:
 *                     type: number
 *                     description: The longitude of the address (optional).
 *                     example: -74.005974
 *                   addressType:
 *                     type: string
 *                     description: The type of address (e.g., home, work).
 *                     example: "home"
 *                   landmark:
 *                     type: string
 *                     description: A nearby landmark (optional).
 *                     example: "Near Central Park"
 *                   postalCode:
 *                     type: string
 *                     description: The postal or ZIP code.
 *                     example: "10001"
 *       401:
 *         description: Unauthorized - Token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal Server Error - An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

/**
 * @swagger
 * /user/address:
 *   post:
 *     summary: Create a new address for the user
 *     description: Adds a new address to the user's profile, including detailed information like location coordinates and address type.
 *     tags:
 *       - User Address
 *     security:
 *       - bearerAuth: [] # Use token-based authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address_line1:
 *                 type: string
 *                 description: The first line of the address.
 *                 example: "123 Main Street"
 *               address_line2:
 *                 type: string
 *                 description: The second line of the address (optional).
 *                 example: "Apartment 4B"
 *               street:
 *                 type: string
 *                 description: The street name.
 *                 example: "Central Park Road"
 *               city:
 *                 type: string
 *                 description: The city name.
 *                 example: "New York"
 *               state:
 *                 type: string
 *                 description: The state name.
 *                 example: "NY"
 *               country:
 *                 type: string
 *                 description: The country name.
 *                 example: "USA"
 *               latitude:
 *                 type: number
 *                 description: The latitude of the address (optional).
 *                 example: 40.712776
 *               longitude:
 *                 type: number
 *                 description: The longitude of the address (optional).
 *                 example: -74.005974
 *               addressType:
 *                 type: string
 *                 description: The type of address (e.g., home, work).
 *                 example: "home"
 *               landmark:
 *                 type: string
 *                 description: A nearby landmark (optional).
 *                 example: "Near Central Park"
 *               postalCode:
 *                 type: string
 *                 description: The postal or ZIP code.
 *                 example: "10001"
 *             required:
 *               - address_line1
 *               - city
 *               - state
 *               - country
 *               - postalCode
 * 
 *     responses:
 *       200:
 *         description: Address created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Address created successfully"
 *                 id:
 *                   type: string
 *                   description: The unique ID of the newly created address.
 *                   example: "c1234567-89ab-cdef-0123-456789abcdef"
 *       400:
 *         description: Bad Request - Missing or invalid input data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation error"
 *       401:
 *         description: Unauthorized - Token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal Server Error - An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */


/**
 * @swagger
 * /cart:
 *   post:
 *     summary: Create a new cart for the user
 *     description: Creates a new cart associated with the authenticated user.
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cart_id:
 *                   type: string
 *                   example: "cart_123"
 *       401:
 *         description: Authentication error.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /cart/{id}:
 *   get:
 *     summary: Get cart details
 *     description: Retrieve cart details, including items, subtotal, shipping, and total for the authenticated user.
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the cart to retrieve.
 *     responses:
 *       200:
 *         description: Cart details retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "cart_123"
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "item_123"
 *                       name:
 *                         type: string
 *                         example: "Sample Item"
 *                       price:
 *                         type: number
 *                         example: 20.0
 *                       quantity:
 *                         type: integer
 *                         example: 2
 *                 subTotal:
 *                   type: number
 *                   example: 40.0
 *                 shipping:
 *                   type: number
 *                   example: 10.0
 *                 total:
 *                   type: number
 *                   example: 50.0
 *       401:
 *         description: Authentication error.
 *       404:
 *         description: Cart not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /cart/{id}:
 *   post:
 *     summary: Create an order from a cart
 *     description: Converts a cart to an order with a 'created' status for the authenticated user.
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the cart to convert to an order.
 *     responses:
 *       200:
 *         description: Order created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order_id:
 *                   type: string
 *                   example: "order_123"
 *       401:
 *         description: Authentication error.
 *       404:
 *         description: Cart not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /order:
 *   get:
 *     summary: Get all orders for the authenticated user
 *     description: Retrieve all orders placed by the authenticated user, including associated cart and cart items details.
 *     tags:
 *       - Orders
 *     security:
 *       - BearerAuth: [] # Use Bearer token for authentication
 *     responses:
 *       200:
 *         description: A list of orders with their cart details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Order ID
 *                         example: "order_12345"
 *                       status:
 *                         type: string
 *                         description: Order status
 *                         example: "completed"
 *                       cart:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Cart ID
 *                             example: "cart_67890"
 *                           items:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                   description: Cart item ID
 *                                   example: 1
 *                                 name:
 *                                   type: string
 *                                   description: Name of the item
 *                                   example: "Laptop"
 *                                 description:
 *                                   type: string
 *                                   description: Description of the item
 *                                   example: "A high-end gaming laptop"
 *                                 quantity:
 *                                   type: integer
 *                                   description: Quantity of the item
 *                                   example: 2
 *                                 units:
 *                                   type: string
 *                                   description: Units of the item
 *                                   example: "pieces"
 *                                 price:
 *                                   type: number
 *                                   format: float
 *                                   description: Price of the item
 *                                   example: 1500.50
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       404:
 *         description: No orders found for this user
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /order/{id}/cancel:
 *   post:
 *     summary: Cancel an order
 *     description: Cancels an order if it meets certain conditions.
 *     operationId: cancelOrder
 *     tags:
 *       - Orders
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the order to be canceled.
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Request body to cancel the order (not needed in this case).
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties: {}
 *     responses:
 *       '200':
 *         description: Order successfully canceled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Order has been successfully cancelled."
 *       '400':
 *         description: |
 *           Bad request due to one of the following reasons:
 *           - Order not found
 *           - Order already delivered
 *           - Order already cancelled
 *           - Order has been picked-up and no more cancellations possible
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Order has been picked-up. No more cancellation possible."
 *       '403':
 *         description: User not authorized to cancel the order
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "You are not authorized to cancel this order."
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *     security:
 *       - bearerAuth: []
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /order/{id}/track:
 *   get:
 *     summary: Track the status of an order
 *     description: Fetches the current status and delivery status of an order.
 *     operationId: trackOrder
 *     tags:
 *       - Orders
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the order to track.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successfully fetched the order status and delivery status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orderStatus:
 *                   type: string
 *                   description: The current status of the order.
 *                   example: "in-progress"
 *                 deliveryStatus:
 *                   type: string
 *                   description: The current delivery status of the order.
 *                   example: "out-for-delivery"
 *       '403':
 *         description: Unauthorized user trying to track an order they do not own
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized user"
 *       '404':
 *         description: Order not found for the specified ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No orders found for this user"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *     security:
 *       - bearerAuth: []  # Assuming you're using a bearer token for authentication
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /order/{id}:
 *   get:
 *     summary: Get details of a specific order
 *     description: Fetches the details of an order by its ID. Returns order details such as the status, delivery status, and associated cart items.
 *     operationId: getOrderById
 *     tags:
 *       - Orders
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the order to fetch details for.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successfully fetched order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: object
 *                   description: The details of the order.
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: The ID of the order.
 *                       example: "12345"
 *                     status:
 *                       type: string
 *                       description: The current status of the order.
 *                       example: "in-progress"
 *                     deliveryStatus:
 *                       type: string
 *                       description: The current delivery status of the order.
 *                       example: "out-for-delivery"
 *                     cart:
 *                       type: object
 *                       description: Cart details associated with the order.
 *                       properties:
 *                         userId:
 *                           type: string
 *                           description: The user ID who owns the cart.
 *                           example: "user123"
 *       '403':
 *         description: Unauthorized user trying to access an order they do not own
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized user"
 *       '404':
 *         description: No orders found for the specified ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No orders found for this user"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *     security:
 *       - bearerAuth: []  # Assuming you're using a bearer token for authentication
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */


/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get all notifications
 *     description: Retrieve a list of all notifications.
 *     tags:
 *       - Notification
 *     responses:
 *       200:
 *         description: Successfully retrieved notifications.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Unique identifier for the notification.
 *                   message:
 *                     type: string
 *                     description: The message content of the notification.
 *                   media_url:
 *                     type: string
 *                     description: URL to the media associated with the notification (if any).
 *                   created_date:
 *                     type: string
 *                     format: date-time
 *                     description: The date and time when the notification was created.
 *       500:
 *         description: Server error or issue retrieving notifications.
 */

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Add a new notification
 *     description: Creates a new notification in the system.
 *     tags:
 *       - Notification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: The message content of the notification.
 *               media_url:
 *                 type: string
 *                 description: Optional URL for media associated with the notification.
 *     responses:
 *       201:
 *         description: Successfully added the notification.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A success message.
 *                 notification:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Unique identifier of the created notification.
 *                     message:
 *                       type: string
 *                       description: The content of the notification.
 *                     media_url:
 *                       type: string
 *                       description: URL to the media associated with the notification.
 *                     created_date:
 *                       type: string
 *                       format: date-time
 *                       description: The date and time when the notification was created.
 *       400:
 *         description: Invalid request body (e.g., missing message).
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a notification by ID
 *     description: Deletes a specific notification by its unique ID.
 *     tags:
 *       - Notification
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the notification to delete.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully deleted the notification.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A success message indicating that the notification has been deleted.
 *                 notification:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: ID of the deleted notification.
 *                     message:
 *                       type: string
 *                       description: The content of the deleted notification.
 *                     media_url:
 *                       type: string
 *                       description: URL to the media associated with the deleted notification.
 *                     created_date:
 *                       type: string
 *                       format: date-time
 *                       description: The date and time when the notification was created.
 *       404:
 *         description: Notification not found for the specified ID.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /payment:
 *   post:
 *     summary: Initiate a payment
 *     description: Creates a payment order with Razorpay for the specified amount.
 *     tags:
 *       - Payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 2000
 *     responses:
 *       200:
 *         description: Payment created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "pay_123"
 *                 amount:
 *                   type: number
 *                   example: 50000
 *                 currency:
 *                   type: string
 *                   example: "INR"
 *                 payment_capture:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Authentication error.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /payment/verify:
 *   post:
 *     summary: Verify payment using Razorpay payment details
 *     description: This endpoint verifies the payment by comparing the generated signature with the provided signature from Razorpay.
 *     tags:
 *       - Payment
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         description: The details required to verify the payment.
 *         schema:
 *           type: object
 *           properties:
 *             order_id:
 *               type: string
 *               description: The unique order ID from Razorpay.
 *             payment_id:
 *               type: string
 *               description: The payment ID generated by Razorpay for the payment.
 *             signature:
 *               type: string
 *               description: The signature generated by Razorpay, used to verify the payment.
 *     responses:
 *       200:
 *         description: Payment successfully verified.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the payment verification was successful.
 *                 message:
 *                   type: string
 *                   description: Message indicating the verification result.
 *       400:
 *         description: Payment verification failed due to signature mismatch or other errors.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the payment verification failed.
 *                 message:
 *                   type: string
 *                   description: Message explaining the failure reason.
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates that an error occurred during payment verification.
 *                 message:
 *                   type: string
 *                   description: Error message for internal issues.
 */

/**
 * @swagger
 * /agent:
 *   post:
 *     summary: Create a new task
 *     description: Initiates a task in 'processing' status for the authenticated user.
 *     tags:
 *       - Task
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task_id:
 *                   type: string
 *                   example: "task_123"
 *       401:
 *         description: Authentication error.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /task/{taskId}:
 *   get:
 *     summary: Get task status and details
 *     description: Retrieves the status and details of a task for the authenticated user.
 *     tags:
 *       - Task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the task to retrieve.
 *     responses:
 *       200:
 *         description: Task status and details retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 output:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: string
 *                       example: "Task summary"
 *                     lineItems:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "lineItem_123"
 *                           description:
 *                             type: string
 *                             example: "Sample line item"
 *       401:
 *         description: Authentication error.
 *       404:
 *         description: Task not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /home:
 *   get:
 *     summary: Retrieve home screen data
 *     description: Returns banners, carousels, and categories for the home screen.
 *     tags:
 *       - Home (Dummy Cart)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved home screen data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 banner:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: https://placehold.co/240x320
 *                   description: A list of banner image URLs.
 *                 carousel:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1"
 *                       image_url:
 *                         type: string
 *                         example: https://placehold.co/240x320
 *                   description: A list of carousel items with IDs and image URLs.
 *       401:
 *         description: Unauthorized - Invalid or missing token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An unexpected error occurred
 */

/**
 * @swagger
 * /audio:
 *   post:
 *     summary: Upload an audio file and retrieve cart details
 *     description: This endpoint allows users to upload an audio file (MP3 format only) and receive a response containing a sample cart structure.
 *     tags:
 *       - Audio
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: The MP3 file to upload.
 *     responses:
 *       200:
 *         description: Audio file uploaded successfully and cart details returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: File uploaded successfully
 *                 cart:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: cart_123
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: item_123
 *                           name:
 *                             type: string
 *                             example: Sample Item
 *                           price:
 *                             type: number
 *                             example: 20
 *                           quantity:
 *                             type: integer
 *                             example: 2
 *                     subTotal:
 *                       type: number
 *                       example: 40
 *                     shipping:
 *                       type: number
 *                       example: 10
 *                     total:
 *                       type: number
 *                       example: 50
 *       400:
 *         description: Bad Request - No file uploaded or invalid file type.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No file uploaded
 *       401:
 *         description: Unauthorized - Invalid or missing token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An unexpected error occurred
 */

/**
 * @swagger
 * /search-kiko:
 *   post:
 *     summary: Search for sellers using a pincode
 *     description: Sends a pincode to an external API to fetch seller information and returns the response.
 *     tags:
 *       - Kiko Search - Backend
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pincode:
 *                 type: number
 *                 description: The pincode to search for sellers.
 *                 example: 560001
 *     responses:
 *       200:
 *         description: Successfully retrieved seller information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad Request. Pincode is missing from the request body.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Pincode is required"
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An unexpected error occurred"
 */
