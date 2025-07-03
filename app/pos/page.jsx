// Menandai bahwa komponen ini berjalan di sisi klien
"use client";

// Import hooks yang diperlukan dari React
import { useState, useEffect, useRef } from "react";
// Import icon-icon yang diperlukan dari library Lucide
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  CreditCard,
  Banknote,
  Receipt,
  User,
  Hash,
  MapPin,
} from "lucide-react";
// Import komponen toast untuk notifikasi
import { toast } from "react-toastify";
// Import komponen Image dari Next.js untuk optimasi gambar
import Image from "next/image";
// Komentar bahwa sidebar ditangani oleh layout

// Import komponen Sheet dari library Radix
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Mendefinisikan dan mengekspor komponen utama POS
export default function POS() {
  // State untuk menyimpan daftar produk
  const [products, setProducts] = useState([]);
  // State untuk menyimpan item dalam keranjang
  const [cart, setCart] = useState([]);
  // State untuk menyimpan kata kunci pencarian
  const [searchTerm, setSearchTerm] = useState("");
  // State untuk menandai proses loading
  const [isLoading, setIsLoading] = useState(true);
  // State untuk mengontrol tampilan modal pembayaran
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  // State untuk mengontrol tampilan modal struk
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  // State untuk menyimpan metode pembayaran yang dipilih
  const [paymentMethod, setPaymentMethod] = useState("");
  // State untuk menyimpan daftar transaksi
  const [transactions, setTransactions] = useState([]);
  // State untuk menyimpan jumlah uang tunai
  const [cashAmount, setCashAmount] = useState("");
  // State untuk menyimpan data struk
  const [receiptData, setReceiptData] = useState(null);
  // State untuk menyimpan daftar kategori
  const [categories, setCategories] = useState([]);
  // State untuk menyimpan kategori yang dipilih
  const [selectedCategory, setSelectedCategory] = useState("All");
  // State untuk menyimpan data user
  const [user, setUser] = useState(null);

  // State untuk data customer dan order
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [orderType, setOrderType] = useState("dine-in");

  // Ref untuk elemen struk yang akan dicetak
  const receiptRef = useRef(null);
  // State untuk mengontrol auto print
  const [autoPrint, setAutoPrint] = useState(false);

  // State untuk mengontrol tampilan mobile cart
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Effect untuk fetch data produk dan user saat komponen dimount
  useEffect(() => {
    // Fungsi untuk fetch data
    const fetchData = async () => {
      try {
        // Fetch data user dari API
        const userResponse = await fetch("/api/auth/me");
        // Jika response berhasil, simpan data user
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
        }

        // Fetch data produk dari API
        const productsResponse = await fetch("/api/products");
        const fetchedProducts = await productsResponse.json();
        // Set data produk ke state
        setProducts(fetchedProducts);

        // Buat array kategori unik termasuk "All"
        const uniqueCategories = [
          "All",
          ...new Set(fetchedProducts.map((product) => product.category)),
        ];
        // Set kategori ke state
        setCategories(uniqueCategories);

        // Matikan loading state
        setIsLoading(false);
      } catch (error) {
        // Log error dan tampilkan notifikasi jika terjadi kesalahan
        console.error("Error fetching data:", error);
        toast.error("Gagal memuat data");
        setIsLoading(false);
      }
    };

    // Jalankan fungsi fetchData
    fetchData();
  }, []); // Dependencies kosong, effect hanya dijalankan sekali

  // Handler untuk update state searchTerm saat pencarian
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handler untuk mengubah kategori yang dipilih
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  // Filter produk berdasarkan pencarian dan kategori
  const filteredProducts = products.filter((product) => {
    // Cek apakah nama produk cocok dengan pencarian
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    // Cek apakah kategori cocok atau "All" dipilih
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    // Kembalikan true jika kedua kondisi terpenuhi
    return matchesSearch && matchesCategory;
  });

  // Handler untuk menambah item ke keranjang
  const addToCart = (product) => {
    // Cek apakah item sudah ada di keranjang
    const existingItem = cart.find((item) => item.id === product.id);

    // Jika item sudah ada di keranjang
    if (existingItem) {
      // Cek apakah stok mencukupi
      if (existingItem.quantity >= product.stock) {
        // Tampilkan pesan error jika stok tidak cukup
        toast.error(
          `Tidak bisa menambah lagi. Hanya ${product.stock} tersedia di stok.`
        );
        return;
      }

      // Update quantity item yang sudah ada
      const updatedCart = cart.map((item) =>
        item.id === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              subtotal: (item.quantity + 1) * item.price,
            }
          : item
      );
      setCart(updatedCart);
    } else {
      // Cek apakah produk masih ada stok
      if (product.stock <= 0) {
        // Tampilkan pesan error jika stok habis
        toast.error("Produk tidak tersedia");
        return;
      }

      // Tambahkan item baru ke keranjang
      setCart([
        ...cart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          subtotal: product.price,
          image: product.image,
        },
      ]);
    }

    // Tampilkan notifikasi sukses
    toast.success(`${product.name} ditambahkan ke keranjang`);
  };

  // Handler untuk menambah quantity item di keranjang
  const increaseQuantity = (id) => {
    // Cari produk dan item di keranjang
    const product = products.find((p) => p.id === id);
    const item = cart.find((item) => item.id === id);

    // Cek apakah stok mencukupi
    if (item.quantity >= product.stock) {
      // Tampilkan pesan error jika stok tidak cukup
      toast.error(
        `Tidak bisa menambah lagi. Hanya ${product.stock} tersedia di stok.`
      );
      return;
    }

    // Update quantity item
    const updatedCart = cart.map((item) =>
      item.id === id
        ? {
            ...item,
            quantity: item.quantity + 1,
            subtotal: (item.quantity + 1) * item.price,
          }
        : item
    );
    setCart(updatedCart);
  };

  // Handler untuk mengurangi quantity item di keranjang
  const decreaseQuantity = (id) => {
    // Cari item di keranjang
    const item = cart.find((item) => item.id === id);

    // Hapus item jika quantity akan menjadi 0
    if (item.quantity === 1) {
      removeFromCart(id);
      return;
    }

    // Update quantity item
    const updatedCart = cart.map((item) =>
      item.id === id
        ? {
            ...item,
            quantity: item.quantity - 1,
            subtotal: (item.quantity - 1) * item.price,
          }
        : item
    );
    setCart(updatedCart);
  };

  // Handler untuk menghapus item dari keranjang
  const removeFromCart = (id) => {
    // Filter item yang akan dihapus
    const updatedCart = cart.filter((item) => item.id !== id);
    setCart(updatedCart);
    // Tampilkan notifikasi sukses
    toast.success("Item dihapus dari keranjang");
  };

  // Handler untuk mengosongkan keranjang
  const clearCart = () => {
    setCart([]);
    setCustomerName("");
    setTableNumber("");
    setOrderType("dine-in");
    // Tampilkan notifikasi sukses
    toast.success("Keranjang dikosongkan");
  };

  // Fungsi untuk menghitung total belanja
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  // Handler untuk memulai proses checkout
  const handleCheckout = () => {
    // Cek apakah keranjang kosong
    if (cart.length === 0) {
      // Tampilkan pesan error jika keranjang kosong
      toast.error("Keranjang kosong");
      return;
    }

    // Validasi input customer
    if (!customerName.trim()) {
      toast.error("Harap masukkan nama pelanggan");
      return;
    }

    if (orderType === "dine-in" && !tableNumber.trim()) {
      toast.error("Harap masukkan nomor meja untuk pesanan dine-in");
      return;
    }

    // Tampilkan modal pembayaran
    setShowPaymentModal(true);
  };

  // Handler untuk mengubah metode pembayaran
  const handlePaymentMethodChange = (method) => {
    // Set metode pembayaran yang dipilih
    setPaymentMethod(method);

    // Set jumlah uang tunai sesuai metode pembayaran
    if (method === "cash") {
      setCashAmount("");
    } else {
      setCashAmount(calculateTotal().toString());
    }
  };

  // Handler untuk mengubah jumlah uang tunai
  const handleCashAmountChange = (e) => {
    setCashAmount(e.target.value);
  };

  // Handler untuk memproses pembayaran
  const processPayment = async () => {
    // Validasi metode pembayaran
    if (!paymentMethod) {
      toast.error("Harap pilih metode pembayaran");
      return;
    }

    // Validasi jumlah uang tunai
    if (
      paymentMethod === "cash" &&
      Number.parseInt(cashAmount) < calculateTotal()
    ) {
      toast.error("Jumlah uang tunai kurang dari total");
      return;
    }

    try {
      // Siapkan data transaksi
      const transactionData = {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
        totalAmount: calculateTotal(),
        paymentMethod: paymentMethod,
        customerName: customerName,
        tableNumber: orderType === "dine-in" ? tableNumber : null,
        orderType: orderType,
      };

      // Kirim data transaksi ke API
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      });

      // Cek response API
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Transaction failed");
      }

      // Parse response
      const transaction = await response.json();

      // Hitung PPN 10%
      const taxAmount = Math.round(calculateTotal() * 0.1);
      const finalTotal = calculateTotal() + taxAmount;

      // Siapkan data struk
      const receiptData = {
        id: transaction.transaction.id,
        items: cart.map((item) => ({
          ...item,
          notes: item.name.includes("Spicy") ? "No onion" : "",
        })),
        total: calculateTotal(),
        discount: 0,
        tax: taxAmount,
        finalTotal: finalTotal,
        paymentMethod,
        cashAmount: Number.parseInt(cashAmount),
        change:
          paymentMethod === "cash"
            ? Number.parseInt(cashAmount) - finalTotal
            : 0,
        date: new Date(),
        cashier: user?.username || "Regina",
        customerName: customerName,
        tableNumber: orderType === "dine-in" ? tableNumber : null,
        orderType: orderType,
        restaurantName: "Sajiwa Mie Hotplate & steak",
        location:
          "Jl. Kiyai H. Mansyur, RT.04/RW.07, Solokanjeruk, Kec. Solokanjeruk,",
      };

      // Update state untuk menampilkan struk
      setReceiptData(receiptData);
      setShowPaymentModal(false);
      setShowReceiptModal(true);

      // Refresh data transaksi
      const transactionsResponse = await fetch("/api/transactions");
      const fetchedTransactions = await transactionsResponse.json();
      setTransactions(fetchedTransactions);
    } catch (error) {
      // Log error dan tampilkan notifikasi jika terjadi kesalahan
      console.error("Payment processing error:", error);
      toast.error(error.message || "Transaksi gagal");
    }
  };

  // Effect untuk auto print struk
  useEffect(() => {
    if (showReceiptModal && receiptData) {
      setTimeout(() => {
        setAutoPrint(true);
      }, 300);
    }
  }, [showReceiptModal, receiptData]);

  // Effect untuk menangani auto print
  useEffect(() => {
    if (autoPrint && receiptRef.current) {
      printReceipt();
      setAutoPrint(false);
    }
    // eslint-disable-next-line
  }, [autoPrint, receiptData?.paymentMethod]);
  // Fungsi untuk mencetak struk
  const printReceipt = () => {
    // Ambil konten struk
    const printContents = receiptRef.current.innerHTML;
    // Buka window baru untuk print
    const win = window.open("", "Print", "width=400,height=600");
    // Tulis konten HTML ke window print
    win.document.write(`
    <html>
      <head>
        <title>Receipt</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0;
            padding: 0;
            background: #fff; 
          }
          .receipt { 
            max-width: 300px; 
            margin: auto; 
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
          }
          .logo-container {
            text-align: center;
            margin-bottom: 10px;
          }
          .logo {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: #f0f9f0;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
          }
          .restaurant-name {
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            margin: 10px 0 5px 0;
          }
          .restaurant-address {
            text-align: center;
            margin-bottom: 5px;
          }
          .order-type {
            text-align: center;
            font-weight: bold;
            margin-bottom: 12px;
          }
          .separator {
            border-top: 1px dashed #ccc;
            margin: 10px 0;
          }
          .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .items {
            margin: 10px 0;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .payment-section {
            margin-top: 10px;
          }
          .total-row {
            font-weight: bold;
            margin-top: 5px;
          }
          .payment-method {
            margin-top: 10px;
          }
          .paid-status {
            text-align: center;
            font-weight: bold;
            margin-top: 10px;
          }
          .paid-datetime {
            text-align: center;
            margin-bottom: 10px;
          }
          .thank-you {
            text-align: center;
            margin-top: 15px;
          }
          @media print {
            body { background: #fff; }
            .receipt { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="logo-container">
            <img src="/logo.png" alt="Logo Resto" class="logo" />
          </div>
          <div class="restaurant-name">${
            receiptData.restaurantName || "Sajiwa Mie Hotplate & steak"
          }</div>
          <div class="restaurant-address">${
            receiptData.location ||
            "Jl. Kiyai H. Mansyur, RT.04/RW.07, Solokanjeruk, Kec. Solokanjeruk,"
          }</div>
          <div className="order-type">${
            receiptData.orderType === "takeaway" ? "TAKE AWAY" : "DINE IN"
          }</div>
          <div class="separator"></div>
          <div class="receipt-info">
            <span>Date</span>
            <span>${new Date(receiptData.date).toLocaleDateString("id-ID", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            })}</span>
          </div>
          <div class="receipt-info">
            <span>Cashier</span>
            <span>${receiptData.cashier}</span>
          </div>
          <div class="receipt-info">
            <span>Customer</span>
            <span>${receiptData.customerName}</span>
          </div>
          ${
            receiptData.orderType === "dine-in" && receiptData.tableNumber
              ? `
          <div class="receipt-info">
            <span>Table</span>
            <span>${receiptData.tableNumber}</span>
          </div>
          `
              : ""
          }
          <div class="receipt-info">
            <span>Trx ID</span>
            <span>${receiptData.id}</span>
          </div>
          <div class="separator"></div>
          <div class="items">
            ${receiptData.items
              .map(
                (item) => `
              <div class="item">
                <span>${item.name} x${item.quantity} ${
                  item.notes ? "<br>Notes: " + item.notes : ""
                }</span>
                <span>${formatCurrency(item.subtotal)}</span>
              </div>
            `
              )
              .join("")}
          </div>
          <div class="separator"></div>
          <div class="payment-section">
            <div class="payment-info">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(receiptData.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>PPN 10%</span>
                <span>{formatCurrency(receiptData.tax)}</span>
              </div>
              <div className="receipt-info total-row">
                <span>Total</span>
                <span>${formatCurrency(receiptData.finalTotal)}</span>
              </div>
            </div>
            <div class="separator"></div>
            <div class="payment-method">
              <div className="receipt-info">
                <span>Payment Method</span>
                <span>${
                  receiptData.paymentMethod === "qris"
                    ? "Qris"
                    : receiptData.paymentMethod
                }</span>
              </div>
              <div className="receipt-info">
                <span>Changes</span>
                <span>${formatCurrency(receiptData.change || 0)}</span>
              </div>
            </div>
          </div>
          <div class="separator"></div>
          <div class="paid-status">PAID</div>
          <div class="paid-datetime">${new Date(
            receiptData.date
          ).toLocaleDateString("id-ID", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })} - ${new Date(receiptData.date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })}</div>
          <div class="thank-you">Terima kasih atas pesanan Anda!</div>
        </div>
      </body>
    </html>
  `);
    // Tutup dokumen
    win.document.close();
    // Fokus ke window print
    win.focus();
    // Print setelah delay
    setTimeout(() => {
      win.print();
      win.close();
    }, 800);
  };

  // Handler untuk menyelesaikan transaksi
  const finishTransaction = () => {
    // Reset semua state terkait transaksi
    setShowReceiptModal(false);
    setCart([]);
    setPaymentMethod("");
    setCashAmount("");
    setReceiptData(null);
    setCustomerName("");
    setTableNumber("");
    setOrderType("dine-in");
    // Tampilkan notifikasi sukses
    toast.success("Transaksi berhasil diselesaikan");
  };

  // Fungsi untuk memformat mata uang
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Render komponen
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Main Content */}
      <div className="flex-1 flex p-4 min-h-0">
        {/* Products Section */}
        <div className="flex-1 flex flex-col min-w-0 lg:mr-[400px]">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-9 pr-4 py-2 border border-input rounded-md w-full bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex overflow-x-auto pb-2 gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2 rounded-md whitespace-nowrap text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-auto pb-32 lg:pb-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Memuat produk...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-card rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer group"
                    onClick={() => addToCart(product)}
                  >
                    <div className="h-36 overflow-hidden rounded-t-lg">
                      <Image
                        width={300}
                        height={200}
                        src={
                          product.image || "https://via.placeholder.com/300x200"
                        }
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm truncate mb-1">
                        {product.name}
                      </h3>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-primary text-sm">
                          {formatCurrency(product.price)}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            product.stock > 10
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : product.stock > 0
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section - Fixed on the right */}
        <div className="w-96 bg-card rounded-lg shadow-lg border flex flex-col fixed right-4 top-14 bottom-4 z-20 hidden lg:flex">
          {/* Cart Header */}
          <div className="p-4 border-b">
            <h1 className="text-lg font-bold flex items-center gap-2 mb-2">
              <ShoppingCart /> Keranjang
            </h1>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold">
                  Pesanan {customerName || "Pelanggan"}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="p-2 hover:bg-muted rounded-md transition-colors text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Customer Info Section - Minimized */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <input
                type="text"
                placeholder="Nama pelanggan"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="col-span-2 px-2 py-1.5 border border-input rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className="px-2 py-1.5 border border-input rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="dine-in">Dine In</option>
                <option value="takeaway">Take Away</option>
              </select>
              {orderType === "dine-in" && (
                <input
                  type="text"
                  placeholder="No. meja"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="col-span-3 px-2 py-1.5 border border-input rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary mt-2"
                />
              )}
            </div>
          </div>

          {/* Cart Items - More Space */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
                <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-center text-lg font-medium">
                  Keranjang kosong
                </p>
                <p className="text-sm text-center mt-1">
                  Tambahkan produk untuk memulai
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {cart.map((item) => {
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border"
                    >
                      {/* Product Image - Larger */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          width={80}
                          height={80}
                          src={
                            item.image || "https://via.placeholder.com/80x80"
                          }
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm leading-tight mb-1">
                              {item.name}
                            </h3>
                            <p className="text-primary font-bold text-sm">
                              {formatCurrency(item.price)}
                            </p>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 hover:bg-destructive/10 rounded-md transition-colors ml-2 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center border border-input rounded-md">
                            <button
                              onClick={() => decreaseQuantity(item.id)}
                              className="px-2 py-1 hover:bg-muted transition-colors text-sm"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-3 py-1 text-sm font-medium min-w-[40px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => increaseQuantity(item.id)}
                              className="px-2 py-1 hover:bg-muted transition-colors text-sm"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-bold text-primary">
                              {formatCurrency(item.subtotal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Summary - Simplified */}
          {cart.length > 0 && (
            <div className="border-t bg-background">
              {/* Summary */}
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>PPN 10%</span>
                  <span>
                    {formatCurrency(Math.round(calculateTotal() * 0.1))}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>TOTAL</span>
                  <span>
                    {formatCurrency(
                      calculateTotal() + Math.round(calculateTotal() * 0.1)
                    )}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <div className="p-4 pt-0">
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proses Pesanan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Cart Bottom Sheet */}
        <Sheet open={isMobileCartOpen} onOpenChange={setIsMobileCartOpen}>
          <SheetTrigger asChild>
            <button className="lg:hidden fixed bottom-4 right-4 bg-primary text-primary-foreground p-4 rounded-full shadow-lg z-30">
              <div className="relative">
                <ShoppingCart className="h-6 w-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </div>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] flex flex-col">
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <h2 className="text-lg font-bold">
                  Pesanan {customerName || "Pelanggan"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Order #{Date.now().toString().slice(-4)}
                </p>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="p-2 hover:bg-muted rounded-md transition-colors text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Customer Info - Minimized for mobile */}
            <div className="py-3 border-b">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Nama pelanggan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="px-2 py-1.5 border border-input rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="px-2 py-1.5 border border-input rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="dine-in">Dine In</option>
                  <option value="takeaway">Take Away</option>
                </select>
                {orderType === "dine-in" && (
                  <input
                    type="text"
                    placeholder="No. meja"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="col-span-2 px-2 py-1.5 border border-input rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary mt-2"
                  />
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
                  <p className="text-center text-lg font-medium">
                    Keranjang kosong
                  </p>
                  <p className="text-sm text-center mt-1">
                    Tambahkan produk untuk memulai
                  </p>
                </div>
              ) : (
                <div className="space-y-3 p-3">
                  {cart.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          width={48}
                          height={48}
                          src={
                            item.image || "https://via.placeholder.com/48x48"
                          }
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {item.name}
                        </h3>
                        <p className="text-primary font-bold text-xs">
                          {formatCurrency(item.price)}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center border border-input rounded">
                            <button
                              onClick={() => decreaseQuantity(item.id)}
                              className="px-1.5 py-0.5 hover:bg-muted transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-2 py-0.5 text-xs font-medium min-w-[30px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => increaseQuantity(item.id)}
                              className="px-1.5 py-0.5 hover:bg-muted transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-xs font-bold text-primary">
                            {formatCurrency(item.subtotal)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 hover:bg-destructive/10 rounded-md transition-colors text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {cart.length > 3 && (
                    <div className="text-center py-2 text-sm text-muted-foreground">
                      +{cart.length - 3} item lainnya
                    </div>
                  )}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t bg-background p-4">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>PPN 10%</span>
                    <span>
                      {formatCurrency(Math.round(calculateTotal() * 0.1))}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>TOTAL</span>
                    <span>
                      {formatCurrency(
                        calculateTotal() + Math.round(calculateTotal() * 0.1)
                      )}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proses Pesanan
                </button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Pembayaran</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Total Jumlah</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(calculateTotal())}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">
                    Pilih Metode Pembayaran
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handlePaymentMethodChange("cash")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-md border ${
                        paymentMethod === "cash"
                          ? "border-primary bg-primary/10"
                          : "border-input hover:bg-muted"
                      }`}
                    >
                      <Banknote className="h-5 w-5" />
                      Tunai
                    </button>
                    <button
                      onClick={() => handlePaymentMethodChange("qris")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-md border ${
                        paymentMethod === "qris"
                          ? "border-primary bg-primary/10"
                          : "border-input hover:bg-muted"
                      }`}
                    >
                      <CreditCard className="h-5 w-5" />
                      Qris
                    </button>
                  </div>
                </div>

                {paymentMethod === "cash" && (
                  <div>
                    <label
                      htmlFor="cash-amount"
                      className="block text-sm font-medium mb-1"
                    >
                      Jumlah Tunai
                    </label>
                    <input
                      type="number"
                      id="cash-amount"
                      value={cashAmount}
                      onChange={handleCashAmountChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      placeholder="Masukkan jumlah tunai"
                    />

                    {cashAmount &&
                      Number.parseInt(cashAmount) >= calculateTotal() && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Kembalian</p>
                          <p className="text-lg font-bold">
                            {formatCurrency(
                              Number.parseInt(cashAmount) - calculateTotal()
                            )}
                          </p>
                        </div>
                      )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={processPayment}
                  disabled={
                    !paymentMethod ||
                    (paymentMethod === "cash" &&
                      (!cashAmount ||
                        Number.parseInt(cashAmount) < calculateTotal()))
                  }
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proses Pembayaran
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-4 overflow-y-auto" ref={receiptRef}>
              <div className="text-center mb-4">
                <Image
                  src="/logo.png"
                  alt="logo"
                  width={100}
                  height={100}
                  className="mx-auto mb-2"
                />
                <h2 className="text-xl font-bold" style={{ color: "#c5172e" }}>
                  Struk
                </h2>
                <p
                  className="text-muted-foreground"
                  style={{ color: "#85193c" }}
                >
                  Sajiwa Steak Restaurant
                </p>
                <div className="mt-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      receiptData.orderType === "takeaway"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {receiptData.orderType === "takeaway"
                      ? "TAKE AWAY"
                      : "DINE IN"}
                  </span>
                </div>
              </div>

              <div
                className="border-t border-b border-border py-3 my-3"
                style={{ borderColor: "#c5172e" }}
              >
                <div className="flex justify-between text-sm">
                  <span>No. Struk:</span>
                  <span>{receiptData.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tanggal:</span>
                  <span>{receiptData.date.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Kasir:</span>
                  <span>{receiptData.cashier}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pelanggan:</span>
                  <span>{receiptData.customerName}</span>
                </div>
                {receiptData.orderType === "dine-in" &&
                  receiptData.tableNumber && (
                    <div className="flex justify-between text-sm">
                      <span>Meja:</span>
                      <span>{receiptData.tableNumber}</span>
                    </div>
                  )}
              </div>

              <div className="space-y-2 mb-3">
                {receiptData.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div
                className="border-t border-border pt-3"
                style={{ borderColor: "#c5172e" }}
              >
                <div className="flex justify-between">
                  <span className="font-medium">Subtotal</span>
                  <span>{formatCurrency(receiptData.total)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">PPN 10%</span>
                  <span>{formatCurrency(receiptData.tax)}</span>
                </div>

                <div className="flex justify-between font-bold mt-2">
                  <span>Total</span>
                  <span>{formatCurrency(receiptData.finalTotal)}</span>
                </div>

                <div className="flex justify-between mt-3">
                  <span className="font-medium">Metode Pembayaran</span>
                  <span>
                    {receiptData.paymentMethod === "cash" ? "Tunai" : "Qris"}
                  </span>
                </div>

                {receiptData.paymentMethod === "cash" && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium">Jumlah Tunai</span>
                      <span>{formatCurrency(receiptData.cashAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Kembalian</span>
                      <span>{formatCurrency(receiptData.change)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-border mt-auto text-center">
              <p
                className="text-muted-foreground text-sm mb-4"
                style={{ color: "#85193c" }}
              >
                Terima kasih telah makan bersama kami!
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={printReceipt}
                  className="px-4 py-2 bg-[#85193c] text-white rounded-md hover:bg-[#4a102a] transition-colors"
                >
                  Cetak
                </button>
                <button
                  onClick={finishTransaction}
                  className="px-4 py-2 bg-[#fcf259] text-[#4a102a] rounded-md hover:bg-[#c5172e] hover:text-[#fcf259] transition-colors"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
