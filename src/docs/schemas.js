/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *
 *     Message:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           enum: [SUPER_ADMIN, VENDOR_ADMIN, BUYER, ADMIN]
 *         name:
 *           type: string
 *         phone:
 *           type: string
 *         vendor_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *
 *     RegisterRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *         name:
 *           type: string
 *         phone:
 *           type: string
 *         role:
 *           type: string
 *           enum: [BUYER, SUPER_ADMIN, VENDOR_ADMIN]
 *           default: BUYER
 *
 *     LoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *
 *     Vendor:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         vendor_code:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         logo_url:
 *           type: string
 *           nullable: true
 *
 *     CreateVendorRequest:
 *       type: object
 *       required: [name, email]
 *       properties:
 *         vendor_code:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         logo_url:
 *           type: string
 *
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         vendor_id:
 *           type: string
 *           format: uuid
 *         product_sku:
 *           type: string
 *         product_name:
 *           type: string
 *         product_description:
 *           type: string
 *         unit_price:
 *           type: number
 *         unit_cost:
 *           type: number
 *         stock_quantity:
 *           type: integer
 *         unit_of_measure:
 *           type: string
 *         parent_category_name:
 *           type: string
 *         sub_category_name:
 *           type: string
 *         attributes:
 *           type: object
 *         image_url:
 *           type: string
 *           nullable: true
 *         vendor_name:
 *           type: string
 *
 *     CreateProductRequest:
 *       type: object
 *       required: [product_sku, product_name, unit_price]
 *       properties:
 *         vendor_id:
 *           type: string
 *           format: uuid
 *           description: Required when caller is SUPER_ADMIN
 *         product_sku:
 *           type: string
 *         product_name:
 *           type: string
 *         product_description:
 *           type: string
 *         unit_price:
 *           type: number
 *         unit_cost:
 *           type: number
 *         stock_quantity:
 *           type: integer
 *         unit_of_measure:
 *           type: string
 *         parent_category_name:
 *           type: string
 *         sub_category_name:
 *           type: string
 *         attributes:
 *           type: object
 *         image_url:
 *           type: string
 *
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *         parent_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *
 *     CreateCategoryRequest:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:
 *           type: string
 *         parent_id:
 *           type: string
 *           format: uuid
 *
 *     OrderItem:
 *       type: object
 *       required: [product_id, quantity]
 *       properties:
 *         product_id:
 *           type: string
 *           format: uuid
 *         quantity:
 *           type: integer
 *           minimum: 1
 *
 *     CreateOrderRequest:
 *       type: object
 *       required: [vendor_id, items]
 *       properties:
 *         vendor_id:
 *           type: string
 *           format: uuid
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         shipping_address:
 *           type: object
 *         payment_method:
 *           type: string
 *
 *     Blog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         image_url:
 *           type: string
 *           nullable: true
 *         author:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *
 *     CreateBlogRequest:
 *       type: object
 *       required: [title, content]
 *       properties:
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         image_url:
 *           type: string
 *         author:
 *           type: string
 */

module.exports = {};
