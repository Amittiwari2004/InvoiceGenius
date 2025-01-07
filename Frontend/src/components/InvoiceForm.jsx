import React, { useEffect, useState } from "react";
import {
  Store,
  FileText,
  Image,
  Palette,
  Package,
  Trash2,
  Building2,
  Phone,
  Mail,
  Calendar,
  Clock,
  User,
  MapPin,
  CreditCard,
  Receipt,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, "");

const InvoiceForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    storeName: "",
    storeDetails: {
      address: "",
      city: "",
      phone: "",
      email: "",
    },
    invoiceDetails: {
      invoiceNumber: "",
      orderNumber: "",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("en-US", { hour12: false }),
    },
    customer: {
      name: "",
      address: "",
      city: "",
      phone: "",
      email: "",
    },
    deliveryPartner: {
      name: "",
      trackingId: "",
      estimatedDelivery: "",
    },
    color: "#2c3e50",
    logo: null,
    products: [
      {
        name: "",
        brand: "",
        batch: "",
        expiry: "",
        quantity: "",
        mrp: "",
        price: "",
      },
    ],
    paymentMethod: "",
    termsAndConditions: "",
  });
  const [pdfUrl, setPdfUrl] = useState(null);

  const handleChange = (e, section = null) => {
    const { name, value } = e.target;
    if (section) {
      setFormData((prevState) => ({
        ...prevState,
        [section]: {
          ...prevState[section],
          [name]: value,
        },
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      if (file.size <= 5 * 1024 * 1024) {
        // 5MB limit
        setFormData((prevState) => ({
          ...prevState,
          logo: file,
        }));
        setError(null);
      } else {
        setError("File size should be less than 5MB");
      }
    } else {
      setError("Please upload a valid JPG or PNG image");
    }
  };

  const handleProductChange = (index, e) => {
    const { name, value } = e.target;
    const updatedProducts = [...formData.products];
    updatedProducts[index] = { ...updatedProducts[index], [name]: value };
    setFormData((prevState) => ({
      ...prevState,
      products: updatedProducts,
    }));
  };

  const addProduct = () => {
    setFormData((prevState) => ({
      ...prevState,
      products: [
        ...prevState.products,
        {
          name: "",
          brand: "",
          batch: "",
          expiry: "",
          quantity: "",
          mrp: "",
          price: "",
        },
      ],
    }));
  };

  const removeProduct = (index) => {
    if (formData.products.length > 1) {
      setFormData((prevState) => ({
        ...prevState,
        products: prevState.products.filter((_, i) => i !== index),
      }));
    }
  };

  const validateForm = () => {
    if (!formData.storeName || !formData.logo) return false;
    if (!formData.storeDetails.address || !formData.storeDetails.phone)
      return false;
    if (!formData.customer.name || !formData.customer.phone) return false;
    if (!formData.paymentMethod) return false;
    if (!formData.termsAndConditions) return false;

    return formData.products.every(
      (product) =>
        product.name &&
        product.quantity &&
        product.mrp &&
        product.price &&
        parseFloat(product.price) <= parseFloat(product.mrp)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("logo", formData.logo);
      formDataToSend.append("data", JSON.stringify(formData));

      const response = await axios.post(
        `${backendUrl}/generate-invoice`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      setPdfUrl(url);
      toast.success("The invoice has been generated successfully");
    } catch (err) {
      console.error("Error details:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to generate invoice"
      );
      toast.error("Failed to generate invoice");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    console.log("pdfUrl state changed!!");
  }, [pdfUrl]);

  if (pdfUrl) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">
          Invoice Generated Successfully!
        </h2>
        <iframe
          src={pdfUrl}
          className="w-full h-[600px] border border-gray-300 rounded"
          title="Invoice Preview"
        />
        <div className="mt-4 flex gap-4">
          <a
            href={pdfUrl}
            download="invoice.pdf"
            className="inline-flex items-center px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <FileText className="h-5 w-5 mr-2" />
            Download PDF
          </a>
          <button
            onClick={() => setPdfUrl(null)}
            className="inline-flex items-center px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            Create New Invoice
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">Generate Invoice</h1>
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className=" p-4 bg-blue-100 border border-blue-300 text-blue-700 rounded">
          <p>
            For any fields where you {"don't"} have a value, you can enter{" "}
            {"NaN"} as a placeholder.
          </p>
        </div>
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded">
          <p>
            Warning: Please avoid using excessively long addresses, as it may
            cause formatting issues.
          </p>
        </div>
        {/* Store Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Store className="h-5 w-5 mr-2" />
              Store Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Name
                </label>
                <input
                  type="text"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.storeDetails.address}
                  onChange={(e) => handleChange(e, "storeDetails")}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.storeDetails.city}
                  onChange={(e) => handleChange(e, "storeDetails")}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.storeDetails.phone}
                  onChange={(e) => handleChange(e, "storeDetails")}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.storeDetails.email}
                  onChange={(e) => handleChange(e, "storeDetails")}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              Invoice Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceDetails.invoiceNumber}
                  onChange={(e) => handleChange(e, "invoiceDetails")}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Number
                </label>
                <input
                  type="text"
                  name="orderNumber"
                  value={formData.invoiceDetails.orderNumber}
                  onChange={(e) => handleChange(e, "invoiceDetails")}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.invoiceDetails.date}
                  onChange={(e) => handleChange(e, "invoiceDetails")}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.invoiceDetails.time}
                  onChange={(e) => handleChange(e, "invoiceDetails")}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Customer Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.customer.name}
                onChange={(e) => handleChange(e, "customer")}
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.customer.phone}
                onChange={(e) => handleChange(e, "customer")}
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.customer.email}
                onChange={(e) => handleChange(e, "customer")}
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.customer.address}
                onChange={(e) => handleChange(e, "customer")}
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.customer.city}
                onChange={(e) => handleChange(e, "customer")}
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Delivery Partner Details */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Delivery Partner Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Partner Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.deliveryPartner.name}
                onChange={(e) => handleChange(e, "deliveryPartner")}
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tracking ID
              </label>
              <input
                type="text"
                name="trackingId"
                value={formData.deliveryPartner.trackingId}
                onChange={(e) => handleChange(e, "deliveryPartner")}
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Delivery
              </label>
              <input
                type="date"
                name="estimatedDelivery"
                value={formData.deliveryPartner.estimatedDelivery}
                onChange={(e) => handleChange(e, "deliveryPartner")}
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Logo and Color */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo
            </label>
            <input
              type="file"
              name="logo"
              onChange={handleFileChange}
              accept="image/jpeg,image/png"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              required
            />
            <p className="mt-1 text-sm text-gray-500">JPG or PNG, max 5MB</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Color Theme
            </label>
            <input
              type="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="block w-full h-10 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Products Table */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Products
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Name",
                    "Brand",
                    "Batch",
                    "Expiry",
                    "Quantity",
                    "MRP",
                    "Price",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.products.map((product, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        name="name"
                        value={product.name}
                        onChange={(e) => handleProductChange(index, e)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        name="brand"
                        value={product.brand}
                        onChange={(e) => handleProductChange(index, e)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        name="batch"
                        value={product.batch}
                        onChange={(e) => handleProductChange(index, e)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="date"
                        name="expiry"
                        value={product.expiry}
                        onChange={(e) => handleProductChange(index, e)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        name="quantity"
                        value={product.quantity}
                        onChange={(e) => handleProductChange(index, e)}
                        min="1"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        name="mrp"
                        value={product.mrp}
                        onChange={(e) => handleProductChange(index, e)}
                        min="0"
                        step="0.01"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        name="price"
                        value={product.price}
                        onChange={(e) => handleProductChange(index, e)}
                        min="0"
                        step="0.01"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="text-red-600 hover:text-red-900"
                        disabled={formData.products.length === 1}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={addProduct}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Package className="h-5 w-5 mr-2" />
            Add Product
          </button>
        </div>

        {/* Payment Method */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Payment Method
          </h2>
          <input
            type="text"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Credit Card, Cash, Bank Transfer"
            required
          />
        </div>

        {/* Terms and Conditions */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Terms and Conditions
          </h2>
          <textarea
            name="termsAndConditions"
            value={formData.termsAndConditions}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter terms and conditions..."
            required
          />
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating Invoice...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 mr-2" />
                Generate Invoice
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;
