"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  ArrowUpDown,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/admin-layout";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
    category: "",
    image: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/products");

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category &&
        product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === "price" || name === "stock" ? parseInt(value) || "" : value,
    });
  };

  const handleAddProduct = () => {
    setFormData({
      name: "",
      price: "",
      stock: "",
      description: "",
      category: "",
      image: "",
    });
    setShowAddModal(true);
  };

  const handleEditProduct = (product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      stock: product.stock,
      description: product.description || "",
      category: product.category || "",
      image: product.image || "",
    });
    setShowEditModal(true);
  };

  const handleDeleteProduct = (product) => {
    setCurrentProduct(product);
    setShowDeleteModal(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Only JPEG, PNG, and GIF are allowed.");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Create form data
      const formData = new FormData();
      formData.append("file", file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.floor(Math.random() * 10);
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);

      // Upload file
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload image");
      }

      const data = await response.json();
      setUploadProgress(100);

      // Update form data with image URL
      setFormData((prev) => ({
        ...prev,
        image: data.url,
      }));

      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const submitAddProduct = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.name || !formData.price) {
      toast.error("Name and price are required");
      return;
    }

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add product");
      }

      const newProduct = await response.json();
      setProducts([...products, newProduct]);
      setShowAddModal(false);
      toast.success("Product added successfully");
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error(error.message || "Failed to add product");
    }
  };

  const submitEditProduct = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.name || !formData.price) {
      toast.error("Name and price are required");
      return;
    }

    try {
      const response = await fetch(`/api/products/${currentProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update product");
      }

      const updatedProduct = await response.json();

      setProducts(
        products.map((product) =>
          product.id === currentProduct.id ? updatedProduct : product
        )
      );

      setShowEditModal(false);
      toast.success("Product updated successfully");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(error.message || "Failed to update product");
    }
  };

  const submitDeleteProduct = async () => {
    try {
      const response = await fetch(`/api/products/${currentProduct.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete product");
      }

      setProducts(
        products.filter((product) => product.id !== currentProduct.id)
      );
      setShowDeleteModal(false);
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(error.message || "Failed to delete product");
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold">Products</h1>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-9 pr-4 py-2 border border-input rounded-md w-full sm:w-64 bg-background"
              />
            </div>

            <button
              onClick={handleAddProduct}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading products...</p>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left">Image</th>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-1">
                        Name
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-1">
                        Price
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-1">
                        Stock
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="border-t border-border">
                        <td className="px-4 py-3">
                          <div className="h-12 w-12 rounded overflow-hidden">
                            <img
                              src={
                                product.image ||
                                "https://via.placeholder.com/150"
                              }
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {product.name}
                        </td>
                        <td className="px-4 py-3">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-4 py-3">{product.stock}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
                            {product.category || "Uncategorized"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-1 rounded-md hover:bg-muted transition-colors"
                              aria-label="Edit product"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product)}
                              className="p-1 rounded-md hover:bg-muted transition-colors text-destructive"
                              aria-label="Delete product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Add New Product</h2>
              <form onSubmit={submitAddProduct}>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium mb-1"
                    >
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="price"
                      className="block text-sm font-medium mb-1"
                    >
                      Price (IDR) *
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="stock"
                      className="block text-sm font-medium mb-1"
                    >
                      Stock
                    </label>
                    <input
                      type="number"
                      id="stock"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium mb-1"
                    >
                      Category
                    </label>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Product Image
                    </label>

                    {formData.image ? (
                      <div className="relative mt-2">
                        <img
                          src={
                            formData.image.startsWith("/uploads/")
                              ? formData.image
                              : formData.image
                          }
                          alt="Product preview"
                          className="w-full h-40 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <label
                          htmlFor="image-upload"
                          className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed border-input rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                            isUploading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {isUploading ? (
                            <div className="text-center">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                              <span className="text-sm">
                                Uploading... {uploadProgress}%
                              </span>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-6 w-6" />
                              <span>Click to upload image</span>
                            </>
                          )}
                          <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isUploading}
                            ref={fileInputRef}
                          />
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Supported formats: JPEG, PNG, GIF. Max size: 5MB.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Add Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Edit Product</h2>
              <form onSubmit={submitEditProduct}>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="edit-name"
                      className="block text-sm font-medium mb-1"
                    >
                      Name *
                    </label>
                    <input
                      type="text"
                      id="edit-name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border- name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-price"
                      className="block text-sm font-medium mb-1"
                    >
                      Price (IDR) *
                    </label>
                    <input
                      type="number"
                      id="edit-price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-stock"
                      className="block text-sm font-medium mb-1"
                    >
                      Stock
                    </label>
                    <input
                      type="number"
                      id="edit-stock"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-category"
                      className="block text-sm font-medium mb-1"
                    >
                      Category
                    </label>
                    <input
                      type="text"
                      id="edit-category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-description"
                      className="block text-sm font-medium mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id="edit-description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Product Image
                    </label>

                    {formData.image ? (
                      <div className="relative mt-2">
                        <img
                          src={
                            formData.image.startsWith("/uploads/")
                              ? formData.image
                              : formData.image
                          }
                          alt="Product preview"
                          className="w-full h-40 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <label
                          htmlFor="edit-image-upload"
                          className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed border-input rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                            isUploading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {isUploading ? (
                            <div className="text-center">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                              <span className="text-sm">
                                Uploading... {uploadProgress}%
                              </span>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-6 w-6" />
                              <span>Click to upload image</span>
                            </>
                          )}
                          <input
                            id="edit-image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isUploading}
                            ref={fileInputRef}
                          />
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Supported formats: JPEG, PNG, GIF. Max size: 5MB.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Update Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Delete Product</h2>
              <p className="mb-6">
                Are you sure you want to delete{" "}
                <strong>{currentProduct.name}</strong>? This action cannot be
                undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitDeleteProduct}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
