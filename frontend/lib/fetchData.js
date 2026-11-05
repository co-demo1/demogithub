const baseURL = "http://localhost:5000/api";

const getToken = () => {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  const tokenCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("token=")
  );
  return tokenCookie?.split("=")[1];
};

export async function fetchData(endpoint) {
  return fetch(`${baseURL}/${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
}

export async function postData(endpoint, data) {
  return fetch(`${baseURL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
}

// Like postData, but also reports the status of a failed request
export async function postDataWithStatus(endpoint, data) {
  try {
    const response = await fetch(`${baseURL}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) return { status: response.status };
    return { status: response.status, data: await response.json() };
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
    return { status: 0 };
  }
}

export async function putData(endpoint, data) {
  return fetch(`${baseURL}/${endpoint}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
}

export async function deleteData(endpoint) {
  return fetch(`${baseURL}/${endpoint}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return true;
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
}
