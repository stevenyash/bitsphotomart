"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit, MapPin, Loader2, X } from "lucide-react";

interface Address {
  id: string;
  type: string;
  name: string;
  phone: string;
  email: string | null;
  street: string | null;
  city: string;
  county: string | null;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
}

interface AddressListProps {
  addresses: Address[];
  userId: string;
}

export function AddressList({ addresses: initialAddresses, userId }: AddressListProps) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "SHIPPING",
    name: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    county: "",
    postalCode: "",
    country: "Kenya",
    isDefault: false,
  });

  const resetForm = () => {
    setFormData({
      type: "SHIPPING",
      name: "",
      phone: "",
      email: "",
      street: "",
      city: "",
      county: "",
      postalCode: "",
      country: "Kenya",
      isDefault: false,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingId) {
        // Update existing address
        const response = await fetch(`/api/user/addresses/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error("Failed to update address");

        const updated = await response.json();
        setAddresses(addresses.map((a) => (a.id === editingId ? updated : a)));
      } else {
        // Create new address
        const response = await fetch("/api/user/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error("Failed to create address");

        const newAddress = await response.json();
        setAddresses([newAddress, ...addresses]);
      }
      resetForm();
    } catch (error) {
      console.error("Error saving address:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/addresses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete address");

      setAddresses(addresses.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Error deleting address:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingId(address.id);
    setFormData({
      type: address.type,
      name: address.name,
      phone: address.phone,
      email: address.email || "",
      street: address.street || "",
      city: address.city,
      county: address.county || "",
      postalCode: address.postalCode || "",
      country: address.country,
      isDefault: address.isDefault,
    });
    setIsAdding(true);
  };

  return (
    <div>
      {/* Address List */}
      {addresses.length === 0 && !isAdding ? (
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No addresses saved yet</p>
          <Button onClick={() => setIsAdding(true)} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Address
          </Button>
        </div>
      ) : (
        <>
          {/* Address Cards */}
          <div className="space-y-4 mb-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`border rounded-lg p-4 ${
                  address.isDefault ? "border-amber-300 bg-amber-50" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{address.name}</span>
                      {address.isDefault && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground capitalize">
                        {address.type.toLowerCase()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{address.phone}</p>
                    <p className="text-sm text-muted-foreground">
                      {[address.street, address.city, address.county, address.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(address)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(address.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add/Edit Button */}
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} className="w-full bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              Add New Address
            </Button>
          )}
        </>
      )}

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingId ? "Edit Address" : "Add New Address"}
              </h3>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Address Type */}
              <div>
                <label className="block text-sm font-medium mb-1">Address Type</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="SHIPPING">Shipping</option>
                  <option value="BILLING">Billing</option>
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Contact Name *</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <Input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+254712345678"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              {/* Street */}
              <div>
                <label className="block text-sm font-medium mb-1">Street Address</label>
                <Input
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="Street address"
                />
              </div>

              {/* City & County */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <Input
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Nairobi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">County</label>
                  <Input
                    value={formData.county}
                    onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                    placeholder="Nairobi"
                  />
                </div>
              </div>

              {/* Postal Code & Country */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Postal Code</label>
                  <Input
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="00100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Kenya"
                  />
                </div>
              </div>

              {/* Default Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isDefault" className="text-sm">
                  Set as default address
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Update" : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
