import ErrorHandler from "../middlewares/errorMiddleware.js";
import { v2 as cloudinary } from "cloudinary";
import { database } from "../database/db.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";

export const createProduct = catchAsyncErrors(async (req, res, next) => {
  const { name, description, price, category, stock } = req.body;
  const created_by = req.user.id;

  if (!name || !description || !price || !category) {
    return next(
      new ErrorHandler("Please provide complete products details", 400)
    );
  }

  let uploadedImages = [];
  if (req.files && req.files.images) {
    const images = Array.isArray(req.files.images)
      ? req.files.images
      : [req.files.images];

    for (const image of images) {
      const result = await cloudinary.uploader.upload(image.tempFilePath, {
        folder: "Ecommerce_Product_Images",
        width: 1000,
        crop: "scale",
      });

      uploadedImages.push({
        url: result.secure_url,
        public_id: result.public_id,
      });
    }
  }

  const product = await database.query(
    `INSERT INTO products (name, description, price, category, stock, images, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      name,
      description,
      price / 88,
      category,
      stock,
      JSON.stringify(uploadedImages),
      created_by,
    ]
  );

  res.status(201).json({
    success: true,
    message: "Product created successfully.",
    product: product.rows[0],
  });
});

export const fetchAllProducts = catchAsyncErrors(async (req, res, next) => {
  const { availability, price, category, ratings, search } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const conditions = [];
  let values = [];
  let index = 1;

  let paginationPlaceholders = {};

  //Filter products by availability
  if (availability === "in-stock") {
    conditions.push(`stock > 5`);
  } else if (availability === "limited") {
    conditions.push(`stock > 0 AND stock <= 5`);
  } else if (availability === "out-of-stock") {
    conditions.push(`stock = 0`);
  }

  //Filter products by price
  if (price) {
    const [minPrice, maxPrice] = price.split("-");
    if (minPrice && maxPrice) {
      conditions.push(`price BETWEEN $${index} AND $${index + 1}`);
      values.push(minPrice, maxPrice);
      index += 2;
    }
  }

  //Filter products by category
  if (category) {
    conditions.push(`category ILIKE $${index}`);
    values.push(`%${category}%`);
    index++;
  }

  //Filter products by review
  if (ratings) {
    conditions.push(`ratings >= $${index}`);
    values.push(ratings);
    index++;
  }

  //Add search query
  if (search) {
    conditions.push(
      `(p.name ILIKE $${index} OR p.description ILIKE $${index})`
    );
    values.push(`%${search}%`);
    index++;
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  //Get count of filtered products
  const totalProductsResult = await database.query(
    `SELECT COUNT(*) FROM products p ${whereClause}`,
    values
  );

  const totalProducts = parseInt(totalProductsResult.rows[0].count);

  paginationPlaceholders.limit = `$${index}`;
  values.push(limit);
  index++;

  paginationPlaceholders.offset = `$${index}`;
  values.push(offset);
  index++;

  //FETCH WITH REVIEWS
  const query = `
    SELECT p.*, 
    COUNT(r.id) AS review_count 
    FROM products p 
    LEFT JOIN reviews r ON p.id = r.product_id 
    ${whereClause} 
    GROUP BY p.id 
    ORDER BY p.created_at DESC 
    LIMIT ${paginationPlaceholders.limit} 
    OFFSET ${paginationPlaceholders.offset}
  `;
  const result = await database.query(query, values);

  //QUERY FOR FETCHING NEW PRODUCT (interval of 30 days)
  const newProductsQuery = `
    SELECT p.*, 
    COUNT(r.id) AS review_count 
    FROM products p 
    LEFT JOIN reviews r ON p.id = r.product_id 
    WHERE p.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY p.id 
    ORDER BY p.created_at DESC 
    LIMIT 8 
  `;
  const newProductsResult = await database.query(newProductsQuery);

  //QUERY FOR FETCHING TOP RATING PRODUCTS (rating >= 4.5)
  const topRatedQuery = `
    SELECT p.*, COUNT(r.id) AS review_count
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    WHERE p.ratings >= 4.5
    GROUP BY p.id
    ORDER BY p.ratings DESC, p.created_at DESC
    LIMIT 8
  `;
  const topRatedResult = await database.query(topRatedQuery);

  res.status(200).json({
    success: true,
    products: result.rows[0],
    totalProducts,
    newProducts: newProductsResult.rows,
    topRatedProducts: topRatedResult.rows,
  });
});

export const updateProductByCondition = catchAsyncErrors(
  async (req, res, next) => {
    const { productId } = req.params;
    const { name, description, price, category, stock, images } = req.body;

    //console.log(req.user)
    const conditions = [];
    let values = [];
    let index = 1;
    let whereClause = ``;

    if (name) {
      conditions.push(`NAME = $${index}`);
      values.push(name);
      index++;
    }
    if (description) {
      conditions.push(`DESCRIPTION = $${index}`);
      values.push(description);
      index++;
    }
    if (price) {
      conditions.push(`PRICE = $${index}`);
      values.push(price);
      index++;
    }
    if (category) {
      conditions.push(`CATEGORY = $${index}`);
      values.push(category);
      index++;
    }
    if (productId) {
      whereClause = ` WHERE id = $${index} RETURNING *`;
      values.push(productId);
    }

    const updateQuery = `UPDATE products SET ${conditions.join(
      ", "
    )} ${whereClause}`;

    const updateProduct = await database.query(updateQuery, values);
    const updateProductResult = updateProduct.rows[0];

    res.status(201).json({
      success: true,
      product: updateProductResult,
    });
  }
);

export const updateProduct = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  const { name, description, price, category, stock } = req.body;

  if (!name || !description || !price || !category || !stock) {
    return next(new ErrorHandler("Please provide complete details.", 400));
  }

  const findProduct = await database.query(
    `SELECT * FROM products WHERE id = $1`,
    [productId]
  );
  if (findProduct.rows.length === 0) {
    return next(new ErrorHandler("Products not found.", 404));
  }

  const updateProduct = await database.query(
    `UPDATE products SET name = $1, description = $2, price = $3, category = $4, stock = $5 WHERE id = $6 RETURNING *`,
    [name, description, price / 88, category, stock, productId]
  );
  const updateProductResult = updateProduct.rows[0];

  res.status(200).json({
    success: true,
    message: "Products updated successfully",
    updatedProduct: updateProductResult,
  });
});

export const deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;

  let getProduct = "";
  if (productId) {
    getProduct = await database.query(`SELECT * FROM products WHERE id = $1`, [
      productId,
    ]);
  }

  if (getProduct.rows.length === 0) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  const images = getProduct.rows[0].images;

  const deleteProduct = await database.query(
    `DELETE FROM products WHERE id = $1 RETURNING *`,
    [productId]
  );

  console.log(deleteProduct);

  if (deleteProduct.rows.length === 0) {
    return next(new ErrorHandler(`Failed to delete the product`, 500));
  }

  //Delete images from cloudinary
  if (images && images.length > 0) {
    for (const image of images) {
      await cloudinary.uploader.destroy(image.public_id);
    }
  }

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

export const fetchSingleProductMy = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;

  let getProduct = "";
  if (productId) {
    getProduct = await database.query(`SELECT * FROM products WHERE id = $1`, [
      productId,
    ]);
  }
  console.log(getProduct);
  if (getProduct.rows.length === 0) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  const getProductResult = getProduct.rows[0];

  res.status(200).json({
    success: true,
    message: "Product fetched successfully",
    product: getProductResult,
  });
});

export const fetchSingleProduct = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;

  const result = await database.query(
    `
    SELECT p.*, 
    COALESCE(
    json_agg(
    json_build_object(
        'review_id', r.id,
        'rating', r.rating,
        'comment', r.comment,
        'reviewer', json_build_object(
        'id', u.id,
        'name', u.name,
        'avatar', u.avatar
        ))
      ) FILTER (WHERE r.id IS NOT NULL), '[]') AS reviews 
       FROM products p 
       LEFT JOIN reviews r ON p.id = r.product_id 
       LEFT JOIN users u ON u.id = r.user_id 
       WHERE p.id = $1 
       GROUP BY p.id`,
    [productId]
  );

  res.status(200).json({
    success: true,
    message: "Product fetched successfully",
    product: result.rows[0],
  });
});

export const postProductReview = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || !comment) {
    return next(new ErrorHandler("Please provide rating and comment", 400));
  }

  const purchaseCheckQuery = `
    SELECT oi.product_id 
    FROM order_items oi 
    JOIN orders o ON o.id = oi.order_id 
    JOIN payments p ON p.order_id = o.id 
    WHERE o.buyer_id = $1 
    AND oi.product_id = $2 
    AND p.payment_status = 'Paid' 
    LIMIT 1
    `;

  const { rows } = await database.query(purchaseCheckQuery, [
    req.user.id,
    productId,
  ]);

  if (rows.length === 0) {
    return next(
      new ErrorHandler("You can only review a product you have purchased", 403)
    );
  }

  const product = await database.query("SELECT * FROM products WHERE id = $1", [
    productId,
  ]);

  if (product.rows.length === 0) {
    return next(new ErrorHandler("Products not found", 404));
  }

  const isAlreadyReviewed = await database.query(
    `
    SELECT * FROM reviews WHERE product_id = $1 AND user_id = $2`,
    [productId, req.user.id]
  );

  let review;
  if (isAlreadyReviewed.rows.length > 1) {
    review = await database.query(
      `UPDATE reviews SET ratings = $1, comment = $2 WHERE product_id = $3 AND user_id = $4 RETURNING *`,
      [rating, comment, productId, req.user.id]
    );
  } else {
    review = await database.query(
      `INSERT INTO reviews (rating, comment) VALUES($1, $2) WHERE product_id = $3 AND user_id = $4 RETURNING *`,
      [rating, comment, productId, req.user.id]
    );
  }

  if (review.rows.length === 0) {
    return next(new ErrorHandler("Reviews cannot be posted", 400));
  }

  const allReviews = await database.query(
    `
    SELECT AVG(rating) AS average_rating FROM reviews WHERE product_id = $1`,
    [productId]
  );

  const newAvgRating = allReviews.rows[0].average_rating;

  const updateProduct = await database.query(
    `UPDATE products SET ratings = $1 WHERE id = $2 RETURNING *`,
    [newAvgRating, productId]
  );

  res.status(201).json({
    success: true,
    message: "Reviews posted successfully",
    review : review.rows[0],
    product : updateProduct.rows[0]
  });
});
