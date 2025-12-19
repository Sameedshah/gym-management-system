"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  TrendingUp,
  CreditCard,
  CheckCircle,
  Clock,
  ArrowUpDown,
  RefreshCw,
  Download,
} from "lucide-react";
import type { Invoice } from "@/lib/types";
import { Loading } from "@/components/ui/loading";

interface MonthWisePaymentViewProps {
  invoices?: Invoice[];
  onRefresh?: () => void;
}

interface MonthlyGroup {
  month: string;
  year: number;
  monthName: string;
  invoices: (Invoice & { member?: any })[];
  totalRecords: number;
  paidCount: number;
  dueCount: number;
  totalPaidMonths: number;
  totalDueMonths: number;
}

export function MonthWisePaymentView({ invoices: propInvoices, onRefresh }: MonthWisePaymentViewProps) {
  const [invoices, setInvoices] = useState<(Invoice & { member?: any })[]>([]);
  const [loading, setLoading] = useState(!propInvoices);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "due">("all");
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (propInvoices) {
      setInvoices(propInvoices);
      setLoading(false);
    } else {
      fetchInvoices();
    }
  }, [propInvoices]);

  const fetchInvoices = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          member:members(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group invoices by month
  const monthlyGroups = useMemo(() => {
    let filteredInvoices = invoices;

    // Apply search filter
    if (searchTerm) {
      filteredInvoices = invoices.filter(
        (invoice) =>
          invoice.member?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.member?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.member?.member_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filteredInvoices = filteredInvoices.filter(
        (invoice) => invoice.status === statusFilter
      );
    }

    // Group by month
    const groups = new Map<string, MonthlyGroup>();

    filteredInvoices.forEach((invoice) => {
      const date = new Date(invoice.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const year = date.getFullYear();
      const monthName = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });

      if (!groups.has(monthKey)) {
        groups.set(monthKey, {
          month: monthKey,
          year,
          monthName,
          invoices: [],
          totalRecords: 0,
          paidCount: 0,
          dueCount: 0,
          totalPaidMonths: 0,
          totalDueMonths: 0,
        });
      }

      const group = groups.get(monthKey)!;
      group.invoices.push(invoice);
      group.totalRecords++;

      if (invoice.status === "paid") {
        group.paidCount++;
        group.totalPaidMonths += invoice.months_due || 1;
      } else if (invoice.status === "due") {
        group.dueCount++;
        group.totalDueMonths += invoice.months_due || 1;
      }
    });

    // Convert to array and sort
    let sortedGroups = Array.from(groups.values());

    // Apply year filter
    if (selectedYear !== "all") {
      sortedGroups = sortedGroups.filter(
        (group) => group.year.toString() === selectedYear
      );
    }

    // Sort by month
    sortedGroups.sort((a, b) => {
      const comparison = a.month.localeCompare(b.month);
      return sortOrder === "desc" ? -comparison : comparison;
    });

    return sortedGroups;
  }, [invoices, searchTerm, selectedYear, sortOrder, statusFilter]);

  // Get available years for filter
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    invoices.forEach((invoice) => {
      const year = new Date(invoice.created_at).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [invoices]);

  // Toggle month expansion
  const toggleMonth = (monthKey: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
    } else {
      newExpanded.add(monthKey);
    }
    setExpandedMonths(newExpanded);
  };

  // Expand all months
  const expandAll = () => {
    setExpandedMonths(new Set(monthlyGroups.map((group) => group.month)));
  };

  // Collapse all months
  const collapseAll = () => {
    setExpandedMonths(new Set());
  };

  // Export data as CSV
  const exportToCSV = () => {
    const csvData = [];
    csvData.push(['Month', 'Date', 'Member Name', 'Member ID', 'Months', 'Status', 'Description']);
    
    monthlyGroups.forEach((group) => {
      group.invoices.forEach((invoice) => {
        csvData.push([
          group.monthName,
          new Date(invoice.created_at).toLocaleDateString(),
          invoice.member?.name || 'Unknown Member',
          invoice.member?.member_id || 'N/A',
          invoice.months_due || 1,
          invoice.status,
          invoice.description || (invoice.status === 'paid' ? 'Payment received' : 'Monthly dues')
        ]);
      });
    });

    const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payment-records-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-success text-success-foreground";
      case "due":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4" />;
      case "due":
        return <Clock className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <Loading text="Loading payment records..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Month-wise Payment Records
            </CardTitle>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={monthlyGroups.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={expandAll}
                disabled={monthlyGroups.length === 0}
              >
                Expand All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={collapseAll}
                disabled={monthlyGroups.length === 0}
              >
                Collapse All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by member name, ID, email, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter as any}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="due">Due</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="flex items-center gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortOrder === "desc" ? "Newest First" : "Oldest First"}
            </Button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-2xl font-bold text-primary">
                {monthlyGroups.length}
              </div>
              <div className="text-sm text-muted-foreground">Active Months</div>
            </div>
            <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
              <div className="text-2xl font-bold text-success">
                {monthlyGroups.reduce((sum, group) => sum + group.totalPaidMonths, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Months Paid</div>
            </div>
            <div className="text-center p-4 bg-warning/10 rounded-lg border border-warning/20">
              <div className="text-2xl font-bold text-warning">
                {monthlyGroups.reduce((sum, group) => sum + group.totalDueMonths, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Months Due</div>
            </div>
            <div className="text-center p-4 bg-muted/10 rounded-lg border border-muted/20">
              <div className="text-2xl font-bold text-muted-foreground">
                {monthlyGroups.reduce((sum, group) => sum + group.totalRecords, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Records</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Groups */}
      <div className="space-y-4">
        {monthlyGroups.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No payment records found</p>
              {searchTerm && (
                <p className="text-sm mt-2">Try adjusting your search terms</p>
              )}
            </CardContent>
          </Card>
        ) : (
          monthlyGroups.map((group) => (
            <Card key={group.month}>
              <Collapsible
                open={expandedMonths.has(group.month)}
                onOpenChange={() => toggleMonth(group.month)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedMonths.has(group.month) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        <div>
                          <CardTitle className="text-lg">{group.monthName}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {group.totalRecords} records
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-success">
                            {group.totalPaidMonths} months paid
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {group.paidCount} payments
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-warning">
                            {group.totalDueMonths} months due
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {group.dueCount} pending
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Member</TableHead>
                            <TableHead>Months</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.invoices
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map((invoice) => (
                              <TableRow key={invoice.id}>
                                <TableCell>
                                  <div className="text-sm">
                                    {new Date(invoice.created_at).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(invoice.created_at).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">
                                    {invoice.member?.name || "Unknown Member"}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    ID: {invoice.member?.member_id || "N/A"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">
                                    {invoice.months_due || 1} month(s)
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(invoice.status)}>
                                    {getStatusIcon(invoice.status)}
                                    <span className="ml-1">{invoice.status}</span>
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {invoice.description ||
                                      (invoice.status === "paid"
                                        ? "Payment received"
                                        : "Monthly dues")}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}