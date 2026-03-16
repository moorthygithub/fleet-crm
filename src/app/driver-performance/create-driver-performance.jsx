import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BASE_URL from "@/config/base-url";
import axios from "axios";
import Cookies from "js-cookie";
import { Loader } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CreateDriverPerformance = ({ refetch }) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [performanceDate, setPerformanceDate] = useState("");
  const [performanceType, setPerformanceType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!file || !performanceDate || !performanceType) {
      toast.error("All fields are required");
      return;
    }

    const token = Cookies.get("token");
    const formData = new FormData();
    formData.append("upload_files", file);
    formData.append("performance_date", performanceDate);
    formData.append("performance_type", performanceType);

    try {
      setIsLoading(true);
      const response = await axios.post(
        `${BASE_URL}/api/driver-performance`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response?.data?.code === 201 || response?.status === 201) {
        toast.success(
          response.data.message || "Driver performance uploaded successfully",
        );
        if (refetch) refetch();
        setFile(null);
        setPerformanceDate("");
        setPerformanceType("");
        setOpen(false);
      } else {
        toast.error(
          response?.data?.message || "Failed to upload driver performance",
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to upload driver performance",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="inline-block">
          <Button variant="default" size="sm">
            Create Driver Performance
          </Button>
        </div>
      </PopoverTrigger>

      <PopoverContent side="bottom" align="start" className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">
              Upload Driver Performance
            </h4>
            <p className="text-sm text-muted-foreground">
              Fill in the details and upload the performance file
            </p>
          </div>

          <div className="grid gap-3">
            {/* Performance Date Field */}
            <div className="grid gap-1">
              <label htmlFor="performance_date" className="text-sm font-medium">
                Performance Date
              </label>
              <Input
                id="performance_date"
                type="date"
                value={performanceDate}
                onChange={(e) => setPerformanceDate(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Performance Type Field - Now as Input */}
            <div className="grid gap-1">
              <label htmlFor="performance_type" className="text-sm font-medium">
                Performance Type
              </label>
              <Select
                value={performanceType}
                onValueChange={setPerformanceType}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select performance type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Uber Black">Uber Black</SelectItem>
                  <SelectItem value="Uber Green">Uber Green</SelectItem>
                </SelectContent>
              </Select>
              {/* <Input
                id="performance_type"
                type="text"
                value={performanceType}
                onChange={(e) => setPerformanceType(e.target.value)}
                placeholder="Enter performance type (e.g., Uber Black)"
                className="w-full"
              /> */}
            </div>

            {/* File Upload Field */}
            <div className="grid gap-1">
              <label htmlFor="upload_files" className="text-sm font-medium">
                Upload File
              </label>
              <Input
                id="upload_files"
                type="file"
                accept=".csv, .xls, .xlsx, .json, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json, text/csv"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: CSV, Excel, JSON
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="mt-2"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Performance"
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CreateDriverPerformance;
