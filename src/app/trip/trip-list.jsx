import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import BASE_URL from "@/config/base-url";
import useNumericInput from "@/hooks/use-numeric-input";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import axios from "axios";
import Cookies from "js-cookie";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import moment from "moment";
import CreateTrip from "./create-trip";

const TripList = () => {
  const queryClient = useQueryClient();
  const keyDown = useNumericInput();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [previousSearchTerm, setPreviousSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [pageInput, setPageInput] = useState("");
  const storeCurrentPage = () => {
    Cookies.set("tripReturnPage", (pagination.pageIndex + 1).toString(), {
      expires: 1,
    });
  };

  const handleViewTrip = (id) => {
    storeCurrentPage();
    navigate(`/trip/view/${id}`);
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ trip_push_date, trip_sl_no }) => {
      const token = Cookies.get("token");
      const formData = new FormData();
      formData.append("trip_push_date", trip_push_date);
      formData.append("trip_sl_no", trip_sl_no);

      const response = await axios.post(
        `${BASE_URL}/api/tripAlldelete`,
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
    onSuccess: (data) => {
      toast.success(data.message || "Trip deleted successfully");
      // Invalidate and refetch trips query
      queryClient.invalidateQueries({
        queryKey: ["trips", debouncedSearchTerm, pagination.pageIndex + 1],
      });
      setDeleteDialogOpen(false);
      setSelectedTrip(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete trip");
      setDeleteDialogOpen(false);
      setSelectedTrip(null);
    },
  });

  const handleDeleteClick = (trip) => {
    setSelectedTrip(trip);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTrip) {
      deleteMutation.mutate({
        trip_push_date: selectedTrip.trip_push_date,
        trip_sl_no: selectedTrip.trip_sl_no,
      });
    }
  };

  // Restore page from cookies when component mounts
  useEffect(() => {
    const savedPage = Cookies.get("tripReturnPage");
    if (savedPage) {
      Cookies.remove("tripReturnPage");

      setTimeout(() => {
        const pageIndex = parseInt(savedPage) - 1;
        if (pageIndex >= 0) {
          setPagination((prev) => ({ ...prev, pageIndex }));
          setPageInput(savedPage);

          queryClient.invalidateQueries({
            queryKey: ["trips"],
            exact: false,
          });
        }
      }, 100);
    }
  }, [queryClient]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      const isNewSearch =
        searchTerm !== previousSearchTerm && previousSearchTerm !== "";

      if (isNewSearch) {
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      }

      setDebouncedSearchTerm(searchTerm);
      setPreviousSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm, previousSearchTerm]);

  const {
    data: tripsData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["trips", debouncedSearchTerm, pagination.pageIndex + 1],
    queryFn: async () => {
      const token = Cookies.get("token");
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
      });

      if (debouncedSearchTerm) {
        params.append("search", debouncedSearchTerm);
      }

      const response = await axios.get(`${BASE_URL}/api/trip?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data.data;
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const currentPage = pagination.pageIndex + 1;
    const totalPages = tripsData?.last_page || 1;

    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      queryClient.prefetchQuery({
        queryKey: ["trips", debouncedSearchTerm, nextPage],
        queryFn: async () => {
          const token = Cookies.get("token");
          const params = new URLSearchParams({
            page: nextPage.toString(),
          });

          if (debouncedSearchTerm) {
            params.append("search", debouncedSearchTerm);
          }

          const response = await axios.get(`${BASE_URL}/api/trip?${params}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          return response.data.data;
        },
        staleTime: 5 * 60 * 1000,
      });
    }

    if (currentPage > 1) {
      const prevPage = currentPage - 1;

      if (!queryClient.getQueryData(["trips", debouncedSearchTerm, prevPage])) {
        queryClient.prefetchQuery({
          queryKey: ["trips", debouncedSearchTerm, prevPage],
          queryFn: async () => {
            const token = Cookies.get("token");
            const params = new URLSearchParams({
              page: prevPage.toString(),
            });

            if (debouncedSearchTerm) {
              params.append("search", debouncedSearchTerm);
            }

            const response = await axios.get(`${BASE_URL}/api/trip?${params}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
            return response.data.data;
          },
          staleTime: 5 * 60 * 1000,
        });
      }
    }
  }, [
    pagination.pageIndex,
    debouncedSearchTerm,
    queryClient,
    tripsData?.last_page,
  ]);

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({
    "Trip UUID": false,
    "Driver UUID": false,
    "Vehicle UUID": false,
  });
  const [rowSelection, setRowSelection] = useState({});

  const columns = [
    {
      id: "S. No.",
      header: "S. No.",
      cell: ({ row }) => {
        const globalIndex =
          pagination.pageIndex * pagination.pageSize + row.index + 1;
        return <div className="text-xs font-medium">{globalIndex}</div>;
      },
      size: 60,
    },
    {
      accessorKey: "trip_uuid",
      id: "Trip UUID",
      header: "Trip UUID",
      cell: ({ row }) => (
        <div className="text-xs font-mono">{row.getValue("Trip UUID")}</div>
      ),
    },
    {
      accessorKey: "trip_driver_first_name",
      id: "Driver",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-8 text-xs"
        >
          Driver
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-[13px] font-medium">
          {row.original.trip_driver_first_name}{" "}
          {row.original.trip_driver_surname}
        </div>
      ),
    },
    {
      accessorKey: "trip_driver_uuid",
      id: "Driver UUID",
      header: "Driver UUID",
      cell: ({ row }) => (
        <div className="text-xs font-mono">{row.getValue("Driver UUID")}</div>
      ),
    },
    {
      accessorKey: "trip_vehicle_number_plate",
      id: "Vehicle",
      header: "Vehicle",
      cell: ({ row }) => (
        <div className="text-xs font-medium">{row.getValue("Vehicle")}</div>
      ),
      size: 120,
    },
    {
      accessorKey: "trip_vehicle_uuid",
      id: "Vehicle UUID",
      header: "Vehicle UUID",
      cell: ({ row }) => (
        <div className="text-xs font-mono">{row.getValue("Vehicle UUID")}</div>
      ),
    },
    {
      accessorKey: "trip_service_type",
      id: "Service Type",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-8 text-xs"
        >
          Service Type
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const serviceType = row.getValue("Service Type");
        const formattedType = serviceType
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        return <div className="text-xs">{formattedType}</div>;
      },
      size: 120,
    },
    {
      accessorKey: "trip_product_type",
      id: "Product Type",
      header: "Product Type",
      cell: ({ row }) => (
        <div className="text-xs">{row.getValue("Product Type")}</div>
      ),
      size: 120,
    },
    {
      id: "Trip Times",
      header: "Trip Times",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="text-xs">
            <span className="font-medium">Request:</span>{" "}
            {moment(row.original.trip_request_time).format(
              "DD-MM-YYYY HH:mm:ss",
            )}
          </div>
          {row.original.trip_drop_off_time && (
            <div className="text-xs">
              <span className="font-medium">Drop-off:</span>{" "}
              {moment(row.original.trip_drop_off_time).format(
                "DD-MM-YYYY HH:mm:ss",
              )}
            </div>
          )}
        </div>
      ),
      size: 160,
    },
    {
      accessorKey: "trip_distance",
      id: "Distance",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-8 text-xs"
        >
          Distance (km)
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-xs">{row.getValue("Distance")} km</div>
      ),
      size: 100,
    },
    {
      accessorKey: "trip_ride_fare",
      id: "Fare",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-8 text-xs"
        >
          Fare (₹)
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const fare = parseFloat(row.getValue("Fare"));
        return <div className="text-xs font-medium">₹{fare.toFixed(2)}</div>;
      },
      size: 100,
    },
    {
      accessorKey: "trip_status",
      id: "Status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-8 text-xs"
        >
          Status
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.getValue("Status");
        const getStatusColor = (status) => {
          switch (status) {
            case "completed":
              return "bg-green-100 text-green-800";
            case "rider_cancelled":
              return "bg-red-100 text-red-800";
            case "driver_cancelled":
              return "bg-orange-100 text-orange-800";
            case "in_progress":
              return "bg-blue-100 text-blue-800";
            default:
              return "bg-gray-100 text-gray-800";
          }
        };
        const getStatusText = (status) => {
          return status
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        };

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}
          >
            {getStatusText(status)}
          </span>
        );
      },
      size: 150,
    },

    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const trip = row.original;

        return (
          <div className="flex flex-row gap-1">
            {/* <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewTrip(trip.id)}
                    className="h-8 w-8"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Trip</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider> */}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(trip)}
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Trip</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
      size: 100,
    },
  ];

  const table = useReactTable({
    data: tripsData?.data || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    pageCount: tripsData?.last_page || -1,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handlePageChange = (newPageIndex) => {
    const targetPage = newPageIndex + 1;
    const cachedData = queryClient.getQueryData([
      "trips",
      debouncedSearchTerm,
      targetPage,
    ]);

    if (cachedData) {
      setPagination((prev) => ({ ...prev, pageIndex: newPageIndex }));
    } else {
      table.setPageIndex(newPageIndex);
    }
  };

  const handlePageInput = (e) => {
    const value = e.target.value;
    setPageInput(value);

    if (value && !isNaN(value)) {
      const pageNum = parseInt(value);
      if (pageNum >= 1 && pageNum <= table.getPageCount()) {
        handlePageChange(pageNum - 1);
      }
    }
  };

  const generatePageButtons = () => {
    const currentPage = pagination.pageIndex + 1;
    const totalPages = table.getPageCount();
    const buttons = [];

    buttons.push(
      <Button
        key={1}
        variant={currentPage === 1 ? "default" : "outline"}
        size="sm"
        onClick={() => handlePageChange(0)}
        className="h-8 w-8 p-0 text-xs"
      >
        1
      </Button>,
    );

    if (currentPage > 3) {
      buttons.push(
        <span key="ellipsis1" className="px-2">
          ...
        </span>,
      );
    }

    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      if (i !== 1 && i !== totalPages) {
        buttons.push(
          <Button
            key={i}
            variant={currentPage === i ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(i - 1)}
            className="h-8 w-8 p-0 text-xs"
          >
            {i}
          </Button>,
        );
      }
    }

    if (currentPage < totalPages - 2) {
      buttons.push(
        <span key="ellipsis2" className="px-2">
          ...
        </span>,
      );
    }

    if (totalPages > 1) {
      buttons.push(
        <Button
          key={totalPages}
          variant={currentPage === totalPages ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(totalPages - 1)}
          className="h-8 w-8 p-0 text-xs"
        >
          {totalPages}
        </Button>,
      );
    }

    return buttons;
  };

  const TableShimmer = () => {
    return Array.from({ length: 10 }).map((_, index) => (
      <TableRow key={index} className="animate-pulse h-11">
        {table.getVisibleFlatColumns().map((column) => (
          <TableCell key={column.id} className="py-1">
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  if (isError) {
    return (
      <div className="w-full p-4  ">
        <div className="flex items-center justify-center h-64 ">
          <div className="text-center ">
            <div className="text-destructive font-medium mb-2">
              Error Fetching Trips List Data
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full p-2">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              trip
              {selectedTrip && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p>
                    <span className="font-medium">Push Date:</span>{" "}
                    {moment(selectedTrip.trip_push_date).format(
                      "DD-MM-YYYY hh:mm A",
                    )}
                  </p>
                  <p>
                    <span className="font-medium">SL No:</span>{" "}
                    {selectedTrip.trip_sl_no}
                  </p>
                  {selectedTrip.trip_driver_first_name && (
                    <p>
                      <span className="font-medium">Driver:</span>{" "}
                      {selectedTrip.trip_driver_first_name}{" "}
                      {selectedTrip.trip_driver_surname}
                    </p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin">⌛</span>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between py-1">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search trips..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchTerm("");
              }
            }}
            className="pl-8 h-9 text-sm bg-gray-50 border-gray-200 focus:border-gray-300 focus:ring-gray-200"
          />
        </div>
        <div className="flex flex-col md:flex-row md:ml-auto gap-2 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                Columns <ChevronDown className="ml-2 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="text-xs capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <CreateTrip refetch={refetch} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-none border min-h-[31rem] grid grid-cols-1">
        <Table className="flex-1">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-10 px-3 bg-[var(--team-color)] text-[var(--label-color)]  text-sm font-medium"
                    style={{ width: header.column.columnDef.size }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isFetching && !table.getRowModel().rows.length ? (
              <TableShimmer />
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="h-2 hover:bg-gray-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-1">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="h-12">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-sm"
                >
                  No trips found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-1">
        <div className="text-sm text-muted-foreground">
          Showing {tripsData?.from || 0} to {tripsData?.to || 0} of{" "}
          {tripsData?.total || 0} trips
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.pageIndex - 1)}
            disabled={!table.getCanPreviousPage()}
            className="h-8 px-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-1">
            {generatePageButtons()}
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <span>Go to</span>
            <Input
              type="tel"
              min="1"
              max={table.getPageCount()}
              value={pageInput}
              onChange={handlePageInput}
              onBlur={() => setPageInput("")}
              onKeyDown={keyDown}
              className="w-16 h-8 text-sm"
              placeholder="Page"
            />
            <span>of {table.getPageCount()}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.pageIndex + 1)}
            disabled={!table.getCanNextPage()}
            className="h-8 px-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TripList;
