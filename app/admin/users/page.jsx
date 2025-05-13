"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, UserPlus, Key } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/admin-layout";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "CASHIER",
  });

  useEffect(() => {
    // Fetch users from API
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/users", {
          method: "GET",
          credentials: "include", // Penting untuk mengirim cookies autentikasi
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setUsers(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAddUser = () => {
    setFormData({
      username: "",
      password: "",
      role: "CASHIER",
    });
    setShowAddModal(true);
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setFormData({
      username: user.username,
      password: "",
      role: user.role,
    });
    setShowEditModal(true);
  };

  const handleDeleteUser = (user) => {
    setCurrentUser(user);
    setShowDeleteModal(true);
  };

  const submitAddUser = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.username || !formData.password) {
      toast.error("Username and password are required");
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add user");
      }

      const newUser = await response.json();
      setUsers([...users, newUser]);
      setShowAddModal(false);
      toast.success("User added successfully");
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error(error.message || "Failed to add user");
    }
  };

  const submitEditUser = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.username) {
      toast.error("Username is required");
      return;
    }

    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user");
      }

      const updatedUser = await response.json();

      // Update users array with the updated user
      setUsers(
        users.map((user) => (user.id === currentUser.id ? updatedUser : user))
      );

      setShowEditModal(false);
      toast.success("User updated successfully");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Failed to update user");
    }
  };

  const submitDeleteUser = async () => {
    // Prevent deleting the last admin
    if (
      currentUser.role === "ADMIN" &&
      users.filter((user) => user.role === "ADMIN").length <= 1
    ) {
      toast.error("Cannot delete the last admin user");
      setShowDeleteModal(false);
      return;
    }

    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user");
      }

      // Remove user from the users array
      setUsers(users.filter((user) => user.id !== currentUser.id));
      setShowDeleteModal(false);
      toast.success("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold">Users</h1>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-9 pr-4 py-2 border border-input rounded-md w-full sm:w-64 bg-background"
              />
            </div>

            <button
              onClick={handleAddUser}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Add User
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading users...</p>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left">Username</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Created At</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-t border-border">
                        <td className="px-4 py-3 font-medium">
                          {user.username}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              user.role === "ADMIN"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-1 rounded-md hover:bg-muted transition-colors"
                              aria-label="Edit user"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1 rounded-md hover:bg-muted transition-colors text-destructive"
                              aria-label="Delete user"
                              disabled={user.username === "admin"}
                            >
                              <Trash2
                                className={`h-4 w-4 ${
                                  user.username === "admin"
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Add New User</h2>
              <form onSubmit={submitAddUser}>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium mb-1"
                    >
                      Username *
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium mb-1"
                    >
                      Password *
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium mb-1"
                    >
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="CASHIER">Manajer</option>
                      <option value="CASHIER">Cashier</option>
                      <option value="ADMIN">Admin</option>
                    </select>
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
                    Add User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Edit User</h2>
              <form onSubmit={submitEditUser}>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="edit-username"
                      className="block text-sm font-medium mb-1"
                    >
                      Username *
                    </label>
                    <input
                      type="text"
                      id="edit-username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-password"
                      className="block text-sm font-medium mb-1"
                    >
                      Password (leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      id="edit-password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-role"
                      className="block text-sm font-medium mb-1"
                    >
                      Role
                    </label>
                    <select
                      id="edit-role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      disabled={currentUser?.username === "manajer"}
                    >
                      <option value="MANAJER">Manajer</option>
                      <option value="CASHIER">Cashier</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    {currentUser?.username === "manajer" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Manajer tidak dapat diubah perannya
                      </p>
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
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Delete User</h2>
              <p className="mb-6">
                Are you sure you want to delete{" "}
                <strong>{currentUser.username}</strong>? This action cannot be
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
                  onClick={submitDeleteUser}
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
