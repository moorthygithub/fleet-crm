import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";
import { ArrowLeft, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import BASE_URL from "@/config/base-url";

const EditDeposit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = Cookies.get("token");

  const [errors, setErrors] = useState({});
  const [initialDeposit, setInitialDeposit] = useState({});
  const [isFormDirty, setIsFormDirty] = useState(false);

  const [deposit, setDeposit] = useState({
    deposit_date: "",
    driver_full_name: "",
    performance_type: "",
    deposit_amount: "",
    deposit_made_from: "",
    deposit_transaction_details: "",
  });

  // Fetch specific deposit record
  const { isLoading: isLoadingDeposit } = useQuery({
    queryKey: ["deposit", id],
    queryFn: async () => {
      const response = await axios.get(`${BASE_URL}/api/driver-deposit/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data?.data;
      if (data) {
        const cleanedData = {
          deposit_date: data.deposit_date || "",
          driver_full_name: data.driver_full_name || "",
          performance_type: data.performance_type || "",
          deposit_amount: data.deposit_amount || "",
          deposit_made_from: data.deposit_made_from || "",
          deposit_transaction_details: data.deposit_transaction_details || "",
        };
        setDeposit(cleanedData);
        setInitialDeposit(cleanedData);
      }
      return data;
    },
    enabled: !!id,
  });

  // Fetch Drivers
  const { data: driversData, isLoading: isLoadingDrivers } = useQuery({
    queryKey: ["deposit-drivers"],
    queryFn: async () => {
      const response = await axios.get(`${BASE_URL}/api/depositDriver`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data || [];
    },
  });

  // Fetch Payment Modes
  const { data: paymentModesData, isLoading: isLoadingPaymentModes } = useQuery(
    {
      queryKey: ["payment-modes"],
      queryFn: async () => {
        const response = await axios.get(
          `${BASE_URL}/api/panel-fetch-payment-mode`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        return response.data.data || [];
      },
    },
  );

  useEffect(() => {
    const isDirty = JSON.stringify(deposit) !== JSON.stringify(initialDeposit);
    setIsFormDirty(isDirty);
  }, [deposit, initialDeposit]);

  const onInputChange = (e) => {
    const { name, value } = e.target;
    setDeposit((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onSelectChange = (name, value) => {
    setDeposit((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "driver_full_name") {
      const selectedDriver = driversData?.find(
        (d) => d.driver_full_name === value,
      );
      if (selectedDriver && selectedDriver.performance_type) {
        setDeposit((prev) => ({
          ...prev,
          performance_type: selectedDriver.performance_type,
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!deposit.deposit_date) {
      newErrors.deposit_date = "Deposit Date is required";
      isValid = false;
    }
    if (!deposit.driver_full_name) {
      newErrors.driver_full_name = "Driver is required";
      isValid = false;
    }
    if (!deposit.performance_type) {
      newErrors.performance_type = "Performance Type is required";
      isValid = false;
    }
    if (!deposit.deposit_amount) {
      newErrors.deposit_amount = "Deposit Amount is required";
      isValid = false;
    }
    if (!deposit.deposit_made_from) {
      newErrors.deposit_made_from = "Deposit Made From is required";
      isValid = false;
    }

    setErrors(newErrors);
    return { isValid, errors: newErrors };
  };

  const updateDepositMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await axios.put(
        `${BASE_URL}/api/driver-deposit/${id}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    },
    onSuccess: async (data) => {
      if (data.code === 201 || data.code === 200) {
        await queryClient.invalidateQueries(["deposits"]);
        await queryClient.invalidateQueries(["deposit", id]);
        toast.success(data.message || "Deposit Updated Successfully");
        navigate("/deposit");
      } else {
        toast.error(data.message || "Deposit Update Error");
      }
    },
    onError: (error) => {
      console.error("Deposit Update Error:", error.response?.data?.message);
      toast.error(error.response?.data?.message || "Deposit Update Error");
    },
    onSettled: () => {
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid, errors } = validateForm();

    if (!isValid) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return;
    }

    try {
      const payload = {
        deposit_date: deposit.deposit_date,
        driver_full_name: deposit.driver_full_name,
        performance_type: deposit.performance_type,
        deposit_amount: deposit.deposit_amount,
        deposit_made_from: deposit.deposit_made_from,
        deposit_transaction_details: deposit.deposit_transaction_details || "",
      };

      updateDepositMutation.mutate(payload);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("An error occurred during submission");
      setIsButtonDisabled(false);
    }
  };

  if (isLoadingDeposit) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-1 p-4">
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <CreditCard className="text-muted-foreground w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h1 className="text-md font-semibold text-gray-900">
                    Edit Driver Deposit
                  </h1>
                  <p className="text-xs text-gray-500 mt-1">
                    Update driver deposit record
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => navigate("/deposit")}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 flex-shrink-0 mt-2 sm:mt-0"
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </Button>
        </div>
      </Card>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center p-1 gap-2 text-sm rounded-md px-1 font-medium bg-[var(--team-color)] text-white">
                <CreditCard className="w-4 h-4" />
                Deposit Details
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                {/* Deposit Date */}
                <div className="space-y-1">
                  <Label htmlFor="deposit_date" className="text-xs font-medium">
                    Deposit Date *
                  </Label>
                  <Input
                    id="deposit_date"
                    name="deposit_date"
                    type="date"
                    value={deposit.deposit_date}
                    onChange={onInputChange}
                  />
                  {errors?.deposit_date && (
                    <p className="text-red-500 text-xs">
                      {errors.deposit_date}
                    </p>
                  )}
                </div>

                {/* Driver Full Name */}
                <div className="space-y-1">
                  <Label
                    htmlFor="driver_full_name"
                    className="text-xs font-medium"
                  >
                    Driver Full Name *
                  </Label>
                  <Select
                    value={deposit.driver_full_name}
                    onValueChange={(value) =>
                      onSelectChange("driver_full_name", value)
                    }
                    disabled={isLoadingDrivers}
                  >
                    <SelectTrigger id="driver_full_name">
                      <SelectValue
                        placeholder={
                          isLoadingDrivers
                            ? "Loading drivers..."
                            : "Select Driver"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {driversData?.map((driver, index) => (
                        <SelectItem key={index} value={driver.driver_full_name}>
                          {driver.driver_full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors?.driver_full_name && (
                    <p className="text-red-500 text-xs">
                      {errors.driver_full_name}
                    </p>
                  )}
                </div>

                {/* Performance Type */}
                <div className="space-y-1">
                  <Label
                    htmlFor="performance_type"
                    className="text-xs font-medium"
                  >
                    Performance Type *
                  </Label>
                  <Input
                    id="performance_type"
                    name="performance_type"
                    value={deposit.performance_type}
                    onChange={onInputChange}
                    placeholder="Enter Performance Type"
                  />
                  {errors?.performance_type && (
                    <p className="text-red-500 text-xs">
                      {errors.performance_type}
                    </p>
                  )}
                </div>

                {/* Deposit Amount */}
                <div className="space-y-1">
                  <Label
                    htmlFor="deposit_amount"
                    className="text-xs font-medium"
                  >
                    Deposit Amount *
                  </Label>
                  <Input
                    id="deposit_amount"
                    name="deposit_amount"
                    type="number"
                    value={deposit.deposit_amount}
                    onChange={onInputChange}
                    placeholder="Enter Amount"
                  />
                  {errors?.deposit_amount && (
                    <p className="text-red-500 text-xs">
                      {errors.deposit_amount}
                    </p>
                  )}
                </div>

                {/* Deposit Made From */}
                <div className="space-y-1">
                  <Label
                    htmlFor="deposit_made_from"
                    className="text-xs font-medium"
                  >
                    Deposit Made From *
                  </Label>
                  <Select
                    value={deposit.deposit_made_from}
                    onValueChange={(value) =>
                      onSelectChange("deposit_made_from", value)
                    }
                    disabled={isLoadingPaymentModes}
                  >
                    <SelectTrigger id="deposit_made_from">
                      <SelectValue
                        placeholder={
                          isLoadingPaymentModes
                            ? "Loading..."
                            : "Select Payment Mode"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentModesData?.map((mode, index) => (
                        <SelectItem key={index} value={mode.payment_mode}>
                          {mode.payment_mode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors?.deposit_made_from && (
                    <p className="text-red-500 text-xs">
                      {errors.deposit_made_from}
                    </p>
                  )}
                </div>
              </div>

              {/* Transaction Details */}
              <div className="space-y-1 mt-4">
                <Label
                  htmlFor="deposit_transaction_details"
                  className="text-xs font-medium"
                >
                  Deposit Transaction Details
                </Label>
                <Textarea
                  id="deposit_transaction_details"
                  name="deposit_transaction_details"
                  value={deposit.deposit_transaction_details}
                  onChange={onInputChange}
                  placeholder="Enter Transaction Details"
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t">
              <Button
                type="submit"
                disabled={
                  updateDepositMutation.isPending ||
                  !isFormDirty
                }
                className="flex items-center gap-2 bg-[var(--team-color)] text-white hover:bg-[var(--team-color)]/90 h-10 px-6 shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {updateDepositMutation.isPending ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Update Deposit
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/deposit")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditDeposit;
