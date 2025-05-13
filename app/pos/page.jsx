"use client";

import { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  CreditCard,
  Banknote,
  Receipt,
} from "lucide-react";
import { toast } from "react-toastify";
import Image from "next/image";
// The sidebar is now handled by the layout file

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [cashAmount, setCashAmount] = useState("");
  const [receiptData, setReceiptData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [user, setUser] = useState(null);

  // Tambahan untuk auto print
  const receiptRef = useRef(null);
  const [autoPrint, setAutoPrint] = useState(false);

  useEffect(() => {
    // Simulate fetching products and user data
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch("/api/auth/me");
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
        }

        // Fetch products
        const productsResponse = await fetch("/api/products");
        const fetchedProducts = await productsResponse.json();
        setProducts(fetchedProducts);

        const uniqueCategories = [
          "All",
          ...new Set(fetchedProducts.map((product) => product.category)),
        ];
        setCategories(uniqueCategories);

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error(
          `Cannot add more. Only ${product.stock} available in stock.`
        );
        return;
      }

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
      if (product.stock <= 0) {
        toast.error("Product is out of stock");
        return;
      }

      setCart([
        ...cart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          subtotal: product.price,
        },
      ]);
    }

    toast.success(`Added ${product.name} to cart`);
  };

  const increaseQuantity = (id) => {
    const product = products.find((p) => p.id === id);
    const item = cart.find((item) => item.id === id);

    if (item.quantity >= product.stock) {
      toast.error(`Cannot add more. Only ${product.stock} available in stock.`);
      return;
    }

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

  const decreaseQuantity = (id) => {
    const item = cart.find((item) => item.id === id);

    if (item.quantity === 1) {
      removeFromCart(id);
      return;
    }

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

  const removeFromCart = (id) => {
    const updatedCart = cart.filter((item) => item.id !== id);
    setCart(updatedCart);
    toast.success("Item removed from cart");
  };

  const clearCart = () => {
    setCart([]);
    toast.success("Cart cleared");
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);

    if (method === "cash") {
      setCashAmount("");
    } else {
      setCashAmount(calculateTotal().toString());
    }
  };

  const handleCashAmountChange = (e) => {
    setCashAmount(e.target.value);
  };

  const processPayment = async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (
      paymentMethod === "cash" &&
      Number.parseInt(cashAmount) < calculateTotal()
    ) {
      toast.error("Cash amount is less than the total");
      return;
    }

    try {
      const transactionData = {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
        totalAmount: calculateTotal(),
        paymentMethod: paymentMethod,
      };

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Transaction failed");
      }

      const transaction = await response.json();

      // Calculate service and tax
      const serviceAmount = Math.round(calculateTotal() * 0.05);
      const taxAmount = Math.round(calculateTotal() * 0.1);
      const finalTotal = calculateTotal() + serviceAmount + taxAmount;

      const receiptData = {
        id: transaction.transaction.id,
        items: cart.map((item) => ({
          ...item,
          notes: item.name.includes("Spicy") ? "No onion" : "",
        })),
        total: calculateTotal(),
        discount: 0,
        service: serviceAmount,
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
        restaurantName: "Master Chef Restaurant",
        location: "South Jakarta",
        tableNumber: "01",
        pax: "4",
        customerName: "Henderson",
      };

      setReceiptData(receiptData);
      setShowPaymentModal(false);
      setShowReceiptModal(true);

      // Refresh transactions
      const transactionsResponse = await fetch("/api/transactions");
      const fetchedTransactions = await transactionsResponse.json();
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error("Payment processing error:", error);
      toast.error(error.message || "Transaction failed");
    }
  };

  // --- AUTO PRINT RECEIPT LOGIC ---
  useEffect(() => {
    if (showReceiptModal && receiptData) {
      setTimeout(() => {
        setAutoPrint(true);
      }, 300);
    }
  }, [showReceiptModal, receiptData]);

  useEffect(() => {
    if (autoPrint && receiptRef.current) {
      printReceipt();
      setAutoPrint(false);
    }
    // eslint-disable-next-line
  }, [autoPrint]);

  const printReceipt = () => {
    const printContents = receiptRef.current.innerHTML;
    const win = window.open("", "Print", "width=400,height=600");
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
            <div class="logo">
              <svg width="40" height="40" viewBox="0 0 24 24">
                <path fill="currentColor" d="M15.5,21L14,8H16.23L15.1,3.46L16.84,3L18.09,8H22L20.5,21H15.5M5,11H10A3,3 0 0,1 13,14H2A3,3 0 0,1 5,11M13,18A3,3 0 0,1 10,21H5A3,3 0 0,1 2,18H13M3,15H8L9.5,16.5L11,15H12A1,1 0 0,1 13,16A1,1 0 0,1 12,17H3A1,1 0 0,1 2,16A1,1 0 0,1 3,15Z" />
              </svg>
            </div>
          </div>
          
          <div class="restaurant-name">${
            receiptData.restaurantName || "Master Chef Restaurant"
          }</div>
          <div class="restaurant-address">${
            receiptData.location || "South Jakarta"
          }</div>
          
          <div class="order-type">Dine in / Table ${
            receiptData.tableNumber || "01"
          } / Pax ${receiptData.pax || "4"}</div>
          
          <div class="separator"></div>
          
          <div class="receipt-info">
            <span>Date</span>
            <span>${new Date(receiptData.date).toLocaleDateString("en-US", {
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
            <span>Trx ID</span>
            <span>${receiptData.id}</span>
          </div>
          
          <div class="receipt-info">
            <span>Customer name</span>
            <span>${receiptData.customerName || "Henderson"}</span>
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
              <div class="receipt-info">
                <span>Subtotal</span>
                <span>${formatCurrency(receiptData.total)}</span>
              </div>
              
              <div class="receipt-info">
                <span>Discount</span>
                <span>${formatCurrency(receiptData.discount || 0)}</span>
              </div>
              
              <div class="receipt-info">
                <span>Service</span>
                <span>${formatCurrency(
                  receiptData.service || Math.round(receiptData.total * 0.05)
                )}</span>
              </div>
              
              <div class="receipt-info">
                <span>PB1</span>
                <span>${formatCurrency(
                  receiptData.tax || Math.round(receiptData.total * 0.1)
                )}</span>
              </div>
              
              <div class="receipt-info total-row">
                <span>Total</span>
                <span>${formatCurrency(
                  receiptData.finalTotal || receiptData.total
                )}</span>
              </div>
            </div>
            
            <div class="separator"></div>
            
            <div class="payment-method">
              <div class="receipt-info">
                <span>Payment Method</span>
                <span>${
                  receiptData.paymentMethod === "card"
                    ? "QR BCA"
                    : receiptData.paymentMethod
                }</span>
              </div>
              
              <div class="receipt-info">
                <span>Changes</span>
                <span>${formatCurrency(receiptData.change || 0)}</span>
              </div>
            </div>
          </div>
          
          <div class="separator"></div>
          
          <div class="paid-status">PAID</div>
          <div class="paid-datetime">${new Date(
            receiptData.date
          ).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })} - ${new Date(receiptData.date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })}</div>
          
          <div class="thank-you">Thank you for your order!</div>
        </div>
      </body>
    </html>
  `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  };

  const finishTransaction = () => {
    setShowReceiptModal(false);
    setCart([]);
    setPaymentMethod("");
    setCashAmount("");
    setReceiptData(null);
    toast.success("Transaction completed successfully");
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
    <div className="p-4 md:p-6 flex-1 flex flex-col">
      <h1 className="text-3xl font-bold mb-6">Point of Sale</h1>
      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* Products Section */}
        <div className="lg:w-2/3 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-9 pr-4 py-2 border border-input rounded-md w-full bg-background"
              />
            </div>

            <div className="flex overflow-x-auto pb-2 gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-3 py-1 rounded-md whitespace-nowrap ${
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

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">
                  Loading products...
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-card rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => addToCart(product)}
                >
                  <div className="h-40 overflow-hidden">
                    <Image
                      width={300}
                      height={200}
                      src={
                        product.image || "https://via.placeholder.com/300x200"
                      }
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold truncate">{product.name}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold text-primary">
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
                        Stock: {product.stock}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="lg:w-1/3 bg-card rounded-lg shadow p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart
            </h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm text-destructive hover:underline"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
                <p>Your cart is empty</p>
                <p className="text-sm">Add products to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b border-border pb-3"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.price)} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-input rounded-md">
                        <button
                          onClick={() => decreaseQuantity(item.id)}
                          className="px-2 py-1 hover:bg-muted transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2">{item.quantity}</span>
                        <button
                          onClick={() => increaseQuantity(item.id)}
                          className="px-2 py-1 hover:bg-muted transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-destructive hover:bg-muted rounded-md transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Subtotal</span>
              <span>{formatCurrency(calculateTotal())}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="font-medium">Tax (0%)</span>
              <span>{formatCurrency(0)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(calculateTotal())}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full mt-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Payment</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Total Amount</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(calculateTotal())}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">
                    Select Payment Method
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
                      Cash
                    </button>
                    <button
                      onClick={() => handlePaymentMethodChange("card")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-md border ${
                        paymentMethod === "card"
                          ? "border-primary bg-primary/10"
                          : "border-input hover:bg-muted"
                      }`}
                    >
                      <CreditCard className="h-5 w-5" />
                      Card
                    </button>
                  </div>
                </div>

                {paymentMethod === "cash" && (
                  <div>
                    <label
                      htmlFor="cash-amount"
                      className="block text-sm font-medium mb-1"
                    >
                      Cash Amount
                    </label>
                    <input
                      type="number"
                      id="cash-amount"
                      value={cashAmount}
                      onChange={handleCashAmountChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      placeholder="Enter cash amount"
                    />

                    {cashAmount &&
                      Number.parseInt(cashAmount) >= calculateTotal() && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Change</p>
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
                  Cancel
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
                  Process Payment
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
                <Receipt
                  className="h-8 w-8 mx-auto mb-2"
                  style={{ color: "#c5172e" }}
                />
                <h2 className="text-xl font-bold" style={{ color: "#c5172e" }}>
                  Receipt
                </h2>
                <p
                  className="text-muted-foreground"
                  style={{ color: "#85193c" }}
                >
                  Sajiwa Steak Restaurant
                </p>
              </div>

              <div
                className="border-t border-b border-border py-3 my-3"
                style={{ borderColor: "#c5172e" }}
              >
                <div className="flex justify-between text-sm">
                  <span>Receipt #:</span>
                  <span>{receiptData.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Date:</span>
                  <span>{receiptData.date.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cashier:</span>
                  <span>{receiptData.cashier}</span>
                </div>
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
                  <span className="font-medium">Service (5%)</span>
                  <span>{formatCurrency(receiptData.service)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Tax (10%)</span>
                  <span>{formatCurrency(receiptData.tax)}</span>
                </div>

                <div className="flex justify-between font-bold mt-2">
                  <span>Total</span>
                  <span>{formatCurrency(receiptData.finalTotal)}</span>
                </div>

                <div className="flex justify-between mt-3">
                  <span className="font-medium">Payment Method</span>
                  <span>
                    {receiptData.paymentMethod === "cash" ? "Cash" : "Card"}
                  </span>
                </div>

                {receiptData.paymentMethod === "cash" && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium">Cash Amount</span>
                      <span>{formatCurrency(receiptData.cashAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Change</span>
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
                Thank you for dining with us!
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={printReceipt}
                  className="px-4 py-2 bg-[#85193c] text-white rounded-md hover:bg-[#4a102a] transition-colors"
                >
                  Print
                </button>
                <button
                  onClick={finishTransaction}
                  className="px-4 py-2 bg-[#fcf259] text-[#4a102a] rounded-md hover:bg-[#c5172e] hover:text-[#fcf259] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
