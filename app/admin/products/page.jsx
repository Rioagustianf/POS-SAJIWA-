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
  // Membuat state untuk menyimpan daftar produk
  const [products, setProducts] = useState([]);
  // Membuat state untuk menandai apakah data sedang dimuat
  const [isLoading, setIsLoading] = useState(true);
  // Membuat state untuk menyimpan kata kunci pencarian
  const [searchTerm, setSearchTerm] = useState("");
  // Membuat state untuk menampilkan modal tambah produk
  const [showAddModal, setShowAddModal] = useState(false);
  // Membuat state untuk menampilkan modal edit produk
  const [showEditModal, setShowEditModal] = useState(false);
  // Membuat state untuk menampilkan modal hapus produk
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // Membuat state untuk menyimpan produk yang sedang dipilih (untuk edit/hapus)
  const [currentProduct, setCurrentProduct] = useState(null);
  // Membuat state untuk menyimpan data form (tambah/edit produk)
  const [formData, setFormData] = useState({
    name: "", // Nama produk
    price: "", // Harga produk
    stock: "", // Stok produk
    description: "", // Deskripsi produk
    category: "", // Kategori produk
    image: "", // URL gambar produk
  });
  // Membuat state untuk menandai status upload gambar
  const [isUploading, setIsUploading] = useState(false);
  // Membuat state untuk menyimpan progress upload gambar
  const [uploadProgress, setUploadProgress] = useState(0);
  // Membuat ref untuk input file gambar
  const fileInputRef = useRef(null);
  // State untuk menyimpan roles user
  const [roles, setRoles] = useState([]);
  // State untuk loading roles user
  const [isRolesLoading, setIsRolesLoading] = useState(true);

  // useEffect dijalankan sekali saat komponen pertama kali dimuat
  useEffect(() => {
    fetchProducts(); // Ambil data produk dari server
  }, []);

  // useEffect untuk fetch roles user saat komponen dimount
  useEffect(() => {
    // Fungsi async untuk ambil data user
    const fetchUserRoles = async () => {
      try {
        // Panggil endpoint untuk ambil data user
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          // Ambil data user dari response
          const data = await response.json();
          // Set roles ke state
          setRoles(data.user.roles || []);
        }
      } catch (error) {
        // Jika error, tampilkan di konsol
        console.error("Gagal mengambil data user:", error);
      } finally {
        // Set loading selesai
        setIsRolesLoading(false);
      }
    };
    fetchUserRoles(); // Panggil fungsi fetch user
  }, []);

  // Fungsi untuk mengambil data produk dari server
  const fetchProducts = async () => {
    try {
      setIsLoading(true); // Set loading menjadi true
      const response = await fetch("/api/products"); // Ambil data produk dari API

      if (!response.ok) {
        throw new Error("Failed to fetch products"); // Jika gagal, lempar error
      }

      const data = await response.json(); // Ubah response ke JSON
      setProducts(data); // Simpan data produk ke state
    } catch (error) {
      console.error("Error fetching products:", error); // Tampilkan error di konsol
      toast.error("Failed to load products"); // Tampilkan notifikasi error
    } finally {
      setIsLoading(false); // Set loading menjadi false
    }
  };

  // Fungsi untuk menangani perubahan input pencarian
  const handleSearch = (e) => {
    setSearchTerm(e.target.value); // Ubah kata kunci pencarian sesuai input user
  };

  // Membuat daftar produk yang sudah difilter berdasarkan kata kunci pencarian
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category &&
        product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Fungsi untuk menangani perubahan input pada form tambah/edit produk
  const handleInputChange = (e) => {
    const { name, value } = e.target; // Ambil nama dan nilai input
    setFormData({
      ...formData, // Salin data form sebelumnya
      [name]:
        name === "price" || name === "stock" ? parseInt(value) || "" : value, // Jika input price/stock, ubah ke angka
    });
  };

  // Fungsi untuk membuka modal tambah produk dan mereset form
  const handleAddProduct = () => {
    setFormData({
      name: "",
      price: "",
      stock: "",
      description: "",
      category: "",
      image: "",
    });
    setShowAddModal(true); // Tampilkan modal tambah produk
  };

  // Fungsi untuk membuka modal edit produk dan mengisi form dengan data produk yang dipilih
  const handleEditProduct = (product) => {
    setCurrentProduct(product); // Set produk yang sedang diedit
    setFormData({
      name: product.name,
      price: product.price,
      stock: product.stock,
      description: product.description || "",
      category: product.category || "",
      image: product.image || "",
    });
    setShowEditModal(true); // Tampilkan modal edit produk
  };

  // Fungsi untuk membuka modal hapus produk dan menyimpan produk yang akan dihapus
  const handleDeleteProduct = (product) => {
    setCurrentProduct(product); // Set produk yang akan dihapus
    setShowDeleteModal(true); // Tampilkan modal hapus produk
  };

  // Fungsi untuk menangani perubahan file gambar
  const handleFileChange = async (e) => {
    const file = e.target.files[0]; // Ambil file yang dipilih user
    if (!file) return; // Jika tidak ada file, keluar

    // Validasi tipe file
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Only JPEG, PNG, and GIF are allowed.");
      return;
    }

    // Validasi ukuran file (maksimal 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB.");
      return;
    }

    try {
      setIsUploading(true); // Set status upload menjadi true
      setUploadProgress(0); // Set progress upload ke 0

      // Membuat FormData untuk upload file
      const formData = new FormData();
      formData.append("file", file); // Tambahkan file ke FormData

      // Simulasi progress upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.floor(Math.random() * 10);
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);

      // Upload file ke server
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      clearInterval(progressInterval); // Hentikan simulasi progress

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload image");
      }

      const data = await response.json(); // Ambil data hasil upload
      setUploadProgress(100); // Set progress upload ke 100

      // Update form data dengan URL gambar
      setFormData((prev) => ({
        ...prev,
        image: data.url,
      }));

      toast.success("Image uploaded successfully"); // Tampilkan notifikasi sukses
    } catch (error) {
      console.error("Error uploading image:", error); // Tampilkan error di konsol
      toast.error(error.message || "Failed to upload image"); // Notifikasi error
    } finally {
      setTimeout(() => {
        setIsUploading(false); // Set status upload menjadi false
        setUploadProgress(0); // Reset progress upload
      }, 500);
    }
  };

  // Fungsi untuk menghapus gambar dari form
  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Fungsi untuk submit form tambah produk
  const submitAddProduct = async (e) => {
    e.preventDefault(); // Mencegah reload halaman

    // Validasi form, nama dan harga wajib diisi
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

      const newProduct = await response.json(); // Ambil data produk baru
      setProducts([...products, newProduct]); // Tambahkan produk baru ke daftar
      setShowAddModal(false); // Tutup modal tambah produk
      toast.success("Product added successfully"); // Notifikasi sukses
    } catch (error) {
      console.error("Error adding product:", error); // Tampilkan error di konsol
      toast.error(error.message || "Failed to add product"); // Notifikasi error
    }
  };

  // Fungsi untuk submit form edit produk
  const submitEditProduct = async (e) => {
    e.preventDefault(); // Mencegah reload halaman

    // Validasi form, nama dan harga wajib diisi
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

      const updatedProduct = await response.json(); // Ambil data produk yang sudah diupdate

      setProducts(
        products.map((product) =>
          product.id === currentProduct.id ? updatedProduct : product
        )
      ); // Update produk di daftar

      setShowEditModal(false); // Tutup modal edit produk
      toast.success("Product updated successfully"); // Notifikasi sukses
    } catch (error) {
      console.error("Error updating product:", error); // Tampilkan error di konsol
      toast.error(error.message || "Failed to update product"); // Notifikasi error
    }
  };

  // Fungsi untuk menghapus produk
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
      ); // Hapus produk dari daftar
      setShowDeleteModal(false); // Tutup modal hapus produk
      toast.success("Product deleted successfully"); // Notifikasi sukses
    } catch (error) {
      console.error("Error deleting product:", error); // Tampilkan error di konsol
      toast.error(error.message || "Failed to delete product"); // Notifikasi error
    }
  };

  // Fungsi untuk memformat angka ke format mata uang Rupiah
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Kelola Produk</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola produk dan stok inventory
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-9 pr-3 py-2 border border-input rounded-md w-full sm:w-56 bg-background text-sm"
              />
            </div>

            <button
              onClick={handleAddProduct}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              Tambah Produk
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">
                Memuat produk...
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-3 py-2 text-left text-sm font-medium">
                      Gambar
                    </th>
                    <th className="px-3 py-2 text-left text-sm font-medium">
                      <div className="flex items-center gap-1">
                        Nama
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-sm font-medium">
                      <div className="flex items-center gap-1">
                        Harga
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-sm font-medium">
                      <div className="flex items-center gap-1">
                        Stok
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-sm font-medium">
                      Kategori
                    </th>
                    <th className="px-3 py-2 text-left text-sm font-medium">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="border-t border-border">
                        <td className="px-3 py-2">
                          <div className="h-10 w-10 rounded overflow-hidden">
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
                        <td className="px-3 py-2 font-medium text-sm">
                          {product.name}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-3 py-2 text-sm">{product.stock}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
                            {product.category || "Tidak dikategorikan"}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-1 rounded-md hover:bg-muted transition-colors"
                              aria-label="Edit product"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <span
                              title={
                                roles.includes("Manajer")
                                  ? "Hapus produk"
                                  : "Hanya manajer yang bisa menghapus produk"
                              }
                              style={{ display: "inline-block" }}
                            >
                              <button
                                onClick={() =>
                                  roles.includes("Manajer") &&
                                  handleDeleteProduct(product)
                                }
                                className={`p-1 rounded-md transition-colors text-destructive ${
                                  roles.includes("Manajer")
                                    ? "hover:bg-muted"
                                    : "opacity-50 cursor-not-allowed"
                                }`}
                                aria-label="Delete product"
                                disabled={!roles.includes("Manajer")}
                                tabIndex={roles.includes("Manajer") ? 0 : -1}
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-3 py-6 text-center text-muted-foreground text-sm"
                      >
                        Tidak ada produk ditemukan
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
