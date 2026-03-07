import api from "./api"

export const getPlaces = () => {
  return api.get("/places")
}

export const getPlaceById = (id) => {
  return api.get(`/places/${id}`)
}

export const createPlace = (formData) => {
  return api.post("/places", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  })
}