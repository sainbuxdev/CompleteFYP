// AdminDashboard.js
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faPlus,
  faEllipsisH,
  faSort,
  faEdit,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import AddUserForm from "./AddUserForm";
import { getAllUserProfiles, removeUser } from "./utils/api";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [showMenu, setShowMenu] = useState(null);

  const handleMenuClick = (index) => {
    setShowMenu(index === showMenu ? null : index);
  };
  useEffect(() => {
    (async () => {
      const allUsers = await getAllUserProfiles();
      setUsers(allUsers);
    })();
  }, []);

  const handleAddUser = (newUser) => {
    (async () => {
      const allUsers = await getAllUserProfiles();
      setUsers(allUsers);
    })();
  };

  const handleDelete = async (userMail) => {
    const result = await removeUser(userMail);
    if (result) {
      alert("User removed Successfully");
      (async () => {
        const allUsers = await getAllUserProfiles();
        setUsers(allUsers);
      })();
    }
  };
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="bg-white shadow-md rounded-lg mt-6">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <FontAwesomeIcon icon={faUser} className="mr-2" /> Name
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                City
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Password
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                CCTV IP
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <div className="flex items-center">
                    <div className="text-gray-900 whitespace-no-wrap">
                      {user.name}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  {user.city}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  {user.email}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  {user.password}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  {user.cctvIp.map((value, index) => {
                    return <div key={index}>{value}</div>;
                  })}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                  <div className="relative inline-block text-left">
                    <FontAwesomeIcon
                      icon={faEllipsisH}
                      className="text-gray-500 cursor-pointer"
                      onClick={() => handleMenuClick(index)}
                    />
                    {showMenu === index && (
                      <div className="absolute z-20 right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              // Handle update action
                              setShowMenu(null);
                            }}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            <FontAwesomeIcon icon={faEdit} className="mr-2" />
                            Update
                          </button>
                          <button
                            onClick={() => {
                              // Handle delete action
                              setShowMenu(null);
                              console.log(user);
                              handleDelete(user.email);
                            }}
                            className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                          >
                            <FontAwesomeIcon icon={faTrash} className="mr-2" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddUserForm onAddUser={handleAddUser} />
    </div>
  );
};

export default AdminDashboard;
