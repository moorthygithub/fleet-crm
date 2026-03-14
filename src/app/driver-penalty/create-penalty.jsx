import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";
import { ArrowLeft, CreditCard, User, History, Calendar, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

const CreatePenalty = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = Cookies.get("token");

  const [errors, setErrors] = useState({});
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const [penalty, setPenalty] = useState({
    penalty_date: new Date().toISOString().split('T')[0],
    driver_full_name: "",
    performance_type: "",
    penalty_amount: "",
    penalty_details: "",
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

  const onInputChange = (e) => {
    const { name, value } = e.target;
    setPenalty((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onSelectChange = (name, value) => {
    setPenalty((prev) => ({
      ...prev,
      [name]: value,
    }));

    // If driver is selected, auto-fill performance_type if available in driversData
    if (name === "driver_full_name") {
      const selectedDriver = driversData?.find(
        (d) => d.driver_full_name === value,
      );
      if (selectedDriver && selectedDriver.performance_type) {
        setPenalty((prev) => ({
          ...prev,
          performance_type: selectedDriver.performance_type,
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!penalty.penalty_date) {
      newErrors.penalty_date = "Penalty Date is required";
      isValid = false;
    }
    if (!penalty.driver_full_name) {
      newErrors.driver_full_name = "Driver is required";
      isValid = false;
    }
    if (!penalty.performance_type) {
      newErrors.performance_type = "Performance Type is required";
      isValid = false;
    }
    if (!penalty.penalty_amount) {
      newErrors.penalty_amount = "Penalty Amount is required";
      isValid = false;
    }

    setErrors(newErrors);
    return { isValid, errors: newErrors };
  };

  const createPenaltyMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await axios.post(
        `${BASE_URL}/api/driver-penalty`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    },
    onSuccess: async (data) => {
      if (data.code === 201 || data.code === 200) {
        await queryClient.invalidateQueries(["penalties"]);
        toast.success(data.message || "Penalty Created Successfully");
        navigate("/penalty");
      } else {
        toast.error(data.message || "Penalty Creation Error");
      }
    },
    onError: (error) => {
      console.error("Penalty Creation Error:", error.response?.data?.message);
      toast.error(error.response?.data?.message || "Penalty Creation Error");
    },
    onSettled: () => {
      setIsButtonDisabled(false);
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
      const formData = new FormData();
      formData.append("penalty_date", penalty.penalty_date);
      formData.append("driver_full_name", penalty.driver_full_name);
      formData.append("performance_type", penalty.performance_type);
      formData.append("penalty_amount", penalty.penalty_amount);
      formData.append(
        "penalty_details",
        penalty.penalty_details || "",
      );

      setIsButtonDisabled(true);
      createPenaltyMutation.mutate(formData);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("An error occurred during submission");
      setIsButtonDisabled(false);
    }
  };

  return (
    <div className="w-full space-y-1 p-4">
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="text-red-600 w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h1 className="text-md font-semibold text-gray-900">
                    Add Driver Penalty
                  </h1>
                  <p className="text-xs text-gray-500 mt-1">
                    Create a new driver penalty record
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => navigate("/penalty")}
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
                <AlertCircle className="w-4 h-4" />
                Penalty Details
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                {/* Penalty Date */}
                <div className="space-y-1">
                  <Label htmlFor="penalty_date" className="text-xs font-medium">
                    Penalty Date *
                  </Label>
                  <Input
                    id="penalty_date"
                    name="penalty_date"
                    type="date"
                    value={penalty.penalty_date}
                    onChange={onInputChange}
                  />
                  {errors?.penalty_date && (
                    <p className="text-red-500 text-xs">
                      {errors.penalty_date}
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
                    value={penalty.driver_full_name}
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
                    value={penalty.performance_type}
                    onChange={onInputChange}
                    placeholder="Enter Performance Type"
                  />
                  {errors?.performance_type && (
                    <p className="text-red-500 text-xs">
                      {errors.performance_type}
                    </p>
                  )}
                </div>

                {/* Penalty Amount */}
                <div className="space-y-1">
                  <Label
                    htmlFor="penalty_amount"
                    className="text-xs font-medium"
                  >
                    Penalty Amount *
                  </Label>
                  <Input
                    id="penalty_amount"
                    name="penalty_amount"
                    type="number"
                    value={penalty.penalty_amount}
                    onChange={onInputChange}
                    placeholder="Enter Amount"
                  />
                  {errors?.penalty_amount && (
                    <p className="text-red-500 text-xs">
                      {errors.penalty_amount}
                    </p>
                  )}
                </div>
              </div>

              {/* Penalty Details */}
              <div className="space-y-1 mt-4">
                <Label
                  htmlFor="penalty_details"
                  className="text-xs font-medium"
                >
                  Penalty Details
                </Label>
                <Textarea
                  id="penalty_details"
                  name="penalty_details"
                  value={penalty.penalty_details}
                  onChange={onInputChange}
                  placeholder="Enter Penalty Details"
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t">
              <Button
                type="submit"
                disabled={isButtonDisabled || createPenaltyMutation.isPending}
                className="flex items-center gap-2"
              >
                {createPenaltyMutation.isPending ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Create Penalty
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/penalty")}
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

export default CreatePenalty;
