import {createUserTable} from "../models/userTable.js";
import {createOrderItemTable} from "../models/orderItemTable.js";
import {createOrdersTable} from "../models/ordersTable.js";
import {createPaymentsTable} from "../models/paymentsTable.js";
import {createProductReviewsTable} from "../models/productReviewsTable.js";
import {createProductsTable} from "../models/productTable.js";
import {createShippingInfoTable} from "../models/shippingInfoTable.js";


export const createTables = async () => {
    try {
        await createUserTable();
        await createProductsTable();
        await createProductReviewsTable();
        await createOrdersTable();
        await createOrderItemTable();
        await createPaymentsTable();
        await createShippingInfoTable();

        console.log("All Tables Created Successfully.");
    } catch (error) {
        console.error("Failed To Create All Tables", error);
        process.exit(1);
    }
}