import axios from "axios";

// base url
const BASE_URL = "http://localhost:3500";

// login

async function login(email, password) {
  try {
    const response = await axios.post(
      `${BASE_URL}/login`,
      {
        email: email,
        password: password,
      },
      {
        "Content-Type": "application/json",
      }
    );
    // You might want to return the response or a specific part of it, such as a token
    return response.data;
  } catch (error) {
    throw error;
  }
}

// function to get profiles details
async function getProfileDetails(userMail, isAdmin) {
  try {
    const response = await axios.post(
      `${BASE_URL}/getProfileDetails`,
      {
        userMail,
        isAdmin,
      },
      {
        "Content-Type": "application/json",
      }
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

// function to update cctv ips
async function updateCCTVIps(userMail, ips) {
  try {
    const response = await axios.put(
      `${BASE_URL}/updateCCTVIps/${userMail}`,
      {
        ips,
      },
      {
        "Content-Type": "application/json",
      }
    );

    return response.data;
  } catch (error) {
    console.log(error);
  }
}

// function to get profiles details
async function getAllUserProfiles() {
  try {
    const response = await axios.get(`${BASE_URL}/getProfileDetails`, {
      "Content-Type": "application/json",
    });
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

async function addUser(user) {
  try {
    const response = await axios.post(
      `${BASE_URL}/getProfileDetails/user`,
      {
        ...user,
        cctvIp: user.cctvIp.split("\n"),
      },
      {
        "Content-Type": "application/json",
      }
    );
    return response.data;
  } catch (error) {
    alert("User cannot be added");
  }
}

async function removeUser(userMail) {
  try {
    const response = await axios.post(
      `${BASE_URL}/getProfileDetails/user/remove`,
      {
        userMail,
      },
      {
        "Content-Type": "application/json",
      }
    );
    return response.data;
  } catch (error) {
    alert("User cannot be added");
  }
}

async function updateAdminDetails(adminMail, fullName, city) {
  try {
    const response = await axios.put(
      `${BASE_URL}/getProfileDetails/admin/update`,
      {
        fullName,
        city,
        adminMail,
      },
      {
        "Content-Type": "application/json",
      }
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export {
  login,
  getProfileDetails,
  updateCCTVIps,
  getAllUserProfiles,
  addUser,
  removeUser,
  updateAdminDetails,
};
