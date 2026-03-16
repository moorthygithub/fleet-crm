import LoadingBar from "@/components/loader/loading-bar";

import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Maintenance from "@/components/common/maintenance";
import SignUp from "@/app/auth/sign-up";

import TripList from "@/app/trip/trip-list";
import DriverList from "@/app/driver/driver-list";
import DriverActivityList from "@/app/driver-activity/driver-activity-list";
import VehicleList from "@/app/vehicle/vehicle-list";
import CreateDriver from "@/app/driver/create-driver";
import CreateVehicle from "@/app/vehicle/create-vehicle";
import EditDriver from "@/app/driver/edit-driver";
import EditVehicle from "@/app/vehicle/edit-vehicle";
import DriverAutoPostionList from "@/app/driver-auto-position/driver-auto-position-list";
import PaymentList from "@/app/payment/payment-list";
import AllThreeReport from "@/app/report/all-three-report";
import DriverPerformanceReport from "@/app/report/driver-performance-report";
import DriverPerfromanceList from "@/app/driver-performance/driver-perfromance-list";
import Settings from "@/app/setting/setting";
import DepositList from "@/app/driver-deposit/deposit-list";
import CreateDeposit from "@/app/driver-deposit/create-deposit";
import EditDeposit from "@/app/driver-deposit/edit-deposit";
import PenaltyList from "@/app/driver-penalty/penalty-list";
import CreatePenalty from "@/app/driver-penalty/create-penalty";
import EditPenalty from "@/app/driver-penalty/edit-penalty";
import NewDriverPerformanceReport from "@/app/report/new-performance";
// import PenaltyList from "@/app/driver-penalty/penalty-list";
// import CreatePenalty from "@/app/driver-penalty/create-penalty";
// import EditPenalty from "@/app/driver-penalty/edit-penalty";
const Login = lazy(() => import("@/app/auth/login"));

const NotFound = lazy(() => import("@/app/errors/not-found"));
const Home = lazy(() => import("@/app/home/home"));

const ForgotPassword = lazy(
  () => import("@/components/forgot-password/forgot-password"),
);
const AuthRoute = lazy(() => import("./auth-route"));
const ProtectedRoute = lazy(() => import("./protected-route"));

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AuthRoute />}>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}
        <Route
          path="/forgot-password"
          element={
            <Suspense fallback={<LoadingBar />}>
              <ForgotPassword />
            </Suspense>
          }
        />
        <Route path="/maintenance" element={<Maintenance />} />
      </Route>

      <Route path="/" element={<ProtectedRoute />}>
        {/* dashboard  */}
        <Route
          path="/home"
          element={
            <Suspense fallback={<LoadingBar />}>
              <Home />
            </Suspense>
          }
        />
        {/* trip  */}
        <Route
          path="/trip"
          element={
            <Suspense fallback={<LoadingBar />}>
              <TripList />
            </Suspense>
          }
        />

        {/* driver  */}
        <Route
          path="/driver"
          element={
            <Suspense fallback={<LoadingBar />}>
              <DriverList />
            </Suspense>
          }
        />
        <Route
          path="/driver/driver-create"
          element={
            <Suspense fallback={<LoadingBar />}>
              <CreateDriver />
            </Suspense>
          }
        />

        <Route
          path="/driver/driver-edit/:id"
          element={
            <Suspense fallback={<LoadingBar />}>
              <EditDriver />
            </Suspense>
          }
        />

        {/* vehicle  */}
        <Route
          path="/vehicle"
          element={
            <Suspense fallback={<LoadingBar />}>
              <VehicleList />
            </Suspense>
          }
        />
        <Route
          path="/vehicle/vehicle-create"
          element={
            <Suspense fallback={<LoadingBar />}>
              <CreateVehicle />
            </Suspense>
          }
        />
        <Route
          path="/vehicle/vehicle-edit/:id"
          element={
            <Suspense fallback={<LoadingBar />}>
              <EditVehicle />
            </Suspense>
          }
        />

        {/* driver activity  */}
        <Route
          path="/activity-driver"
          element={
            <Suspense fallback={<LoadingBar />}>
              <DriverActivityList />
            </Suspense>
          }
        />

        {/* driver auto position  */}
        <Route
          path="/position-auto-driver"
          element={
            <Suspense fallback={<LoadingBar />}>
              <DriverAutoPostionList />
            </Suspense>
          }
        />

        {/* payment  */}
        <Route
          path="/payment"
          element={
            <Suspense fallback={<LoadingBar />}>
              <PaymentList />
            </Suspense>
          }
        />
        <Route
          path="/report"
          element={
            <Suspense fallback={<LoadingBar />}>
              <AllThreeReport />
            </Suspense>
          }
        />

        <Route
          path="/performance-driver-report"
          element={
            <Suspense fallback={<LoadingBar />}>
              <DriverPerformanceReport />
            </Suspense>
          }
        />

        <Route
          path="/list-driver-performance"
          element={
            <Suspense fallback={<LoadingBar />}>
              <DriverPerfromanceList />
            </Suspense>
          }
        />

        <Route
          path="/performance-new"
          element={
            <Suspense fallback={<LoadingBar />}>
              <NewDriverPerformanceReport />
            </Suspense>
          }
        />

        {/* driver deposit  */}
        <Route
          path="/deposit"
          element={
            <Suspense fallback={<LoadingBar />}>
              <DepositList />
            </Suspense>
          }
        />
        <Route
          path="/deposit/create-deposit"
          element={
            <Suspense fallback={<LoadingBar />}>
              <CreateDeposit />
            </Suspense>
          }
        />
        <Route
          path="/deposit/deposit-edit/:id"
          element={
            <Suspense fallback={<LoadingBar />}>
              <EditDeposit />
            </Suspense>
          }
        />

        {/* driver penalty  */}
        <Route
          path="/penalty"
          element={
            <Suspense fallback={<LoadingBar />}>
              <PenaltyList />
            </Suspense>
          }
        />
        <Route
          path="/penalty/create-penalty"
          element={
            <Suspense fallback={<LoadingBar />}>
              <CreatePenalty />
            </Suspense>
          }
        />
        <Route
          path="/penalty/penalty-edit/:id"
          element={
            <Suspense fallback={<LoadingBar />}>
              <EditPenalty />
            </Suspense>
          }
        />

        {/* settings */}
        <Route
          path="/settings"
          element={
            <Suspense fallback={<LoadingBar />}>
              <Settings />
            </Suspense>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
