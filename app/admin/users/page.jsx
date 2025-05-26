"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, UserPlus, Key } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/admin-layout";

export default function Users() {
  // State untuk menyimpan daftar user yang diambil dari backend
  const [users, setUsers] = useState([]);
  // State untuk menandai apakah data sedang dimuat (loading)
  const [isLoading, setIsLoading] = useState(true);
  // State untuk menyimpan kata kunci pencarian user
  const [searchTerm, setSearchTerm] = useState("");
  // State untuk menampilkan atau menyembunyikan modal tambah user
  const [showAddModal, setShowAddModal] = useState(false);
  // State untuk menampilkan atau menyembunyikan modal edit user
  const [showEditModal, setShowEditModal] = useState(false);
  // State untuk menampilkan atau menyembunyikan modal hapus user
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // State untuk menyimpan user yang sedang dipilih (untuk edit/hapus)
  const [currentUser, setCurrentUser] = useState(null);
  // State untuk menyimpan data form (tambah/edit user)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "CASHIER",
  });
  // State untuk role user login
  const [currentUserRole, setCurrentUserRole] = useState("");

  // useEffect dijalankan sekali saat komponen pertama kali dimuat
  useEffect(() => {
    // Fungsi async untuk mengambil data user dari backend
    const fetchUsers = async () => {
      setIsLoading(true); // Set loading menjadi true agar muncul animasi loading
      try {
        // Mengambil data user dari endpoint /api/users dengan method GET
        const response = await fetch("/api/users", {
          method: "GET",
          credentials: "include", // Mengirim cookie autentikasi
          headers: {
            "Content-Type": "application/json",
          },
        });

        // Jika response tidak berhasil, lempar error
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Mengubah response menjadi data JSON
        const data = await response.json();
        setUsers(data); // Simpan data user ke state users
        setIsLoading(false); // Set loading menjadi false agar loading hilang
      } catch (error) {
        // Jika terjadi error, tampilkan pesan error di konsol dan notifikasi
        console.error("Error fetching users:", error);
        toast.error("Gagal memuat data user");
        setIsLoading(false); // Set loading menjadi false
      }
    };

    fetchUsers(); // Memanggil fungsi untuk mengambil data user dari backend
  }, []);

  useEffect(() => {
    // Ambil role user login dari backend (bisa dari /api/users/me atau dari users[0] jika hanya 1 user login)
    const fetchCurrentUserRole = async () => {
      try {
        const res = await fetch("/api/users/me", { credentials: "include" });
        if (res.ok) {
          const me = await res.json();
          setCurrentUserRole(me.role);
        }
      } catch {}
    };
    fetchCurrentUserRole();
  }, []);

  // Fungsi untuk menangani perubahan input pencarian
  // Akan mengubah nilai searchTerm sesuai input user
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Melakukan filter user berdasarkan kata kunci pencarian
  // Hanya user yang username atau role-nya mengandung kata kunci yang akan ditampilkan
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fungsi untuk menangani perubahan input pada form tambah/edit user
  // Akan mengubah nilai pada formData sesuai input user
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData, // Menyalin data form sebelumnya
      [name]: value, // Mengubah field yang sesuai dengan input
    });
  };

  // Fungsi untuk membuka modal tambah user dan mereset form
  // Akan mengosongkan formData dan menampilkan modal tambah user
  const handleAddUser = () => {
    setFormData({
      username: "",
      password: "",
      role: "CASHIER",
    });
    setShowAddModal(true);
  };

  // Fungsi untuk membuka modal edit user dan mengisi form dengan data user yang dipilih
  // Akan mengisi formData dengan data user yang dipilih dan menampilkan modal edit user
  const handleEditUser = (user) => {
    setCurrentUser(user);
    setFormData({
      username: user.username,
      password: "",
      role: user.role,
    });
    setShowEditModal(true);
  };

  // Fungsi untuk membuka modal hapus user dan menyimpan user yang akan dihapus
  // Akan menyimpan user yang dipilih ke currentUser dan menampilkan modal hapus user
  const handleDeleteUser = (user) => {
    setCurrentUser(user);
    setShowDeleteModal(true);
  };

  // Fungsi untuk mengirim data user baru ke backend saat form tambah user disubmit
  // Jika berhasil, user baru akan ditambahkan ke daftar users dan modal ditutup
  const submitAddUser = async (e) => {
    e.preventDefault(); // Mencegah reload halaman saat submit
    // Validasi form, username dan password wajib diisi
    if (!formData.username || !formData.password) {
      toast.error("Username dan password wajib diisi");
      return;
    }
    if (currentUserRole === "Admin" && formData.role === "Manajer") {
      toast.error(
        "Admin tidak boleh menambah/mengubah user dengan role Manajer"
      );
      return;
    }
    try {
      // Mengirim data user baru ke endpoint /api/users dengan method POST
      const response = await fetch("/api/users", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      // Jika response tidak berhasil, tampilkan error
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal menambah user");
      }
      // Jika berhasil, tambahkan user baru ke daftar users dan tutup modal
      const newUser = await response.json();
      setUsers([...users, newUser]);
      setShowAddModal(false);
      toast.success("User berhasil ditambah");
    } catch (error) {
      // Jika error dari backend, tampilkan pesan dari response
      if (error instanceof Error && error.message) {
        toast.error(error.message);
      } else {
        toast.error("Terjadi kesalahan. Silakan coba lagi.");
      }
    }
  };

  // Fungsi untuk mengirim data user yang diedit ke backend saat form edit user disubmit
  // Jika berhasil, data user di daftar users akan diperbarui dan modal ditutup
  const submitEditUser = async (e) => {
    e.preventDefault(); // Mencegah reload halaman
    // Validasi form, username wajib diisi
    if (!formData.username) {
      toast.error("Username wajib diisi");
      return;
    }
    if (currentUserRole === "Admin" && formData.role === "Manajer") {
      toast.error(
        "Admin tidak boleh menambah/mengubah user dengan role Manajer"
      );
      return;
    }
    try {
      // Mengirim data user yang diedit ke endpoint /api/users/:id dengan method PUT
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      // Jika response tidak berhasil, tampilkan error
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal mengubah user");
      }
      // Jika berhasil, update data user di daftar users dan tutup modal
      const updatedUser = await response.json();
      setUsers(
        users.map((user) => (user.id === currentUser.id ? updatedUser : user))
      );
      setShowEditModal(false);
      toast.success("User berhasil diupdate");
    } catch (error) {
      // Jika error dari backend, tampilkan pesan dari response
      if (error instanceof Error && error.message) {
        toast.error(error.message);
      } else {
        toast.error("Terjadi kesalahan. Silakan coba lagi.");
      }
    }
  };

  // Fungsi untuk menghapus user dari backend dan dari daftar users
  // Jika user yang dihapus adalah admin terakhir, proses dibatalkan
  const submitDeleteUser = async () => {
    // Cek agar admin terakhir tidak bisa dihapus
    if (
      currentUser.role === "ADMIN" &&
      users.filter((user) => user.role === "ADMIN").length <= 1
    ) {
      toast.error("Tidak bisa menghapus admin terakhir");
      setShowDeleteModal(false);
      return;
    }
    try {
      // Mengirim permintaan hapus ke endpoint /api/users/:id dengan method DELETE
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      // Jika response tidak berhasil, tampilkan error
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal menghapus user");
      }
      // Jika berhasil, hapus user dari daftar users dan tutup modal
      setUsers(users.filter((user) => user.id !== currentUser.id));
      setShowDeleteModal(false);
      toast.success("User berhasil dihapus");
    } catch (error) {
      // Jika error, tampilkan di konsol dan notifikasi
      console.error("Error deleting user:", error);
      toast.error(error.message || "Gagal menghapus user");
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
              <p className="mt-2 text-muted-foreground">Memuat data user...</p>
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
                            {!(
                              currentUserRole === "Admin" &&
                              user.role === "Manajer"
                            ) && (
                              <>
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="p-1 rounded-md hover:bg-muted transition-colors"
                                  aria-label="Edit user"
                                  disabled={user.username === "admin"}
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
                              </>
                            )}
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
                        Tidak ada user ditemukan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Tambah User Baru</h2>
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
                      disabled={currentUser?.username === "manajer"}
                    >
                      {currentUserRole === "Admin" ? (
                        <>
                          <option value="Admin">Admin</option>
                          <option value="Kasir">Kasir</option>
                        </>
                      ) : (
                        <>
                          <option value="Manajer">Manajer</option>
                          <option value="Admin">Admin</option>
                          <option value="Kasir">Kasir</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Tambah User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
                      Password (kosongkan jika tidak ingin mengubah)
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
                      {currentUserRole === "Admin" ? (
                        <>
                          <option value="Admin">Admin</option>
                          <option value="Kasir">Kasir</option>
                        </>
                      ) : (
                        <>
                          <option value="Manajer">Manajer</option>
                          <option value="Admin">Admin</option>
                          <option value="Kasir">Kasir</option>
                        </>
                      )}
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
                    Batal
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

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Hapus User</h2>
              <p className="mb-6">
                Apakah Anda yakin ingin menghapus{" "}
                <strong>{currentUser.username}</strong>? Tindakan ini tidak
                dapat dibatalkan.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={submitDeleteUser}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
