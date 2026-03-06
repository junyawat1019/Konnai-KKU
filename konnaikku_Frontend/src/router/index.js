import { createRouter, createWebHistory } from "vue-router";
import Home from "@/views/Home.vue";
import Login from "@/views/Login.vue";
import Register from "@/views/Register.vue";
import Place from "@/views/Place.vue";
import PlaceDetail from "@/views/PlaceDetail.vue";
import AddPlace from "@/views/AddPlace.vue";
import EditPlace from "@/views/EditPlace.vue";
import Profile from "@/views/Profile.vue";
import ProfileSettings from "@/views/ProfileSettings.vue";

const routes = [
  { path: "/", name: "Home", component: Home },
  { path: "/login", name: "Login", component: Login },
  { path: "/register", name: "Register", component: Register },
  { path: "/places", name: "Place", component: Place },
  { path: "/place/:id", name: "PlaceDetail", component: PlaceDetail },
  {
    path: "/place/:id/photo",
    name: "PhotoView",
    component: () => import("@/views/PhotoView.vue"),
  },
  { path: "/add-place", name: "AddPlace", component: AddPlace },
  { path: "/edit-place/:id", name: "EditPlace", component: EditPlace },
  {
    path: "/me",
    name: "MyProfile",
    component: Profile,
    props: { isMe: true },
  },
  {
    path: "/profile/:userId",
    name: "UserProfile",
    component: Profile,
    props: true,
  },

  {
    path: "/profile/settings",
    name: "ProfileSettings",
    component: ProfileSettings,
  },

  {
    path: "/reset-password",
    name: "ResetPassword",
    component: () => import("@/views/ResetPassword.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
