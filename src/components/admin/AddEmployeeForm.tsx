import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarIcon, Loader2, Save, User } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function AddEmployeeForm() {
  const createEmployee = useMutation(api.employees.createEmployee);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    streetAddress: "",
    city: "",
    postalCode: "",
    employeeId: "",
    joinDate: new Date(),
    role: "user" as "admin" | "user" | "member" | "driver" | "hr",
    department: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    initialAnnualLeave: 15,
    initialSickLeave: 10,
    notes: ""
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createEmployee({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        streetAddress: formData.streetAddress,
        city: formData.city,
        postalCode: formData.postalCode,
        employeeId: formData.employeeId || undefined,
        joinDate: formData.joinDate.getTime(),
        role: formData.role,
        department: formData.department,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactRelationship: formData.emergencyContactRelationship,
        emergencyContactPhone: formData.emergencyContactPhone,
        initialAnnualLeave: Number(formData.initialAnnualLeave),
        initialSickLeave: Number(formData.initialSickLeave),
        notes: formData.notes,
      });
      toast.success("Employee created successfully");
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        streetAddress: "",
        city: "",
        postalCode: "",
        employeeId: "",
        joinDate: new Date(),
        role: "user",
        department: "",
        emergencyContactName: "",
        emergencyContactRelationship: "",
        emergencyContactPhone: "",
        initialAnnualLeave: 15,
        initialSickLeave: 10,
        notes: ""
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Personal Information */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input 
              id="firstName" 
              placeholder="John" 
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input 
              id="lastName" 
              placeholder="Doe" 
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="john.doe@company.com" 
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input 
              id="phone" 
              placeholder="+1 234 567 890" 
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              required 
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="streetAddress">Street Address</Label>
            <Input 
              id="streetAddress" 
              placeholder="123 Main St" 
              value={formData.streetAddress}
              onChange={(e) => handleInputChange("streetAddress", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input 
              id="city" 
              placeholder="New York" 
              value={formData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input 
              id="postalCode" 
              placeholder="10001" 
              value={formData.postalCode}
              onChange={(e) => handleInputChange("postalCode", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Employment Details */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Employment Details</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee ID (Optional)</Label>
            <Input 
              id="employeeId" 
              placeholder="Auto-generated if left empty" 
              value={formData.employeeId}
              onChange={(e) => handleInputChange("employeeId", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Leave empty to auto-generate</p>
          </div>
          <div className="space-y-2">
            <Label>Join Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.joinDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.joinDate ? format(formData.joinDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.joinDate}
                  onSelect={(date) => date && handleInputChange("joinDate", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role/Position *</Label>
            <Select 
              value={formData.role} 
              onValueChange={(val) => handleInputChange("role", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Select 
              value={formData.department} 
              onValueChange={(val) => handleInputChange("department", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="logistics">Logistics</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="hr">Human Resources</SelectItem>
                <SelectItem value="it">IT</SelectItem>
                <SelectItem value="management">Management</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="emergencyName">Contact Name *</Label>
            <Input 
              id="emergencyName" 
              placeholder="Jane Doe" 
              value={formData.emergencyContactName}
              onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship *</Label>
            <Input 
              id="relationship" 
              placeholder="Spouse" 
              value={formData.emergencyContactRelationship}
              onChange={(e) => handleInputChange("emergencyContactRelationship", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyPhone">Phone Number *</Label>
            <Input 
              id="emergencyPhone" 
              placeholder="+1 234 567 890" 
              value={formData.emergencyContactPhone}
              onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Initial Leave Balance */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Initial Leave Balance</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="annualLeave">Annual Leave Days</Label>
            <Input 
              id="annualLeave" 
              type="number" 
              value={formData.initialAnnualLeave}
              onChange={(e) => handleInputChange("initialAnnualLeave", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Default: 15 days per year</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sickLeave">Sick Leave Days</Label>
            <Input 
              id="sickLeave" 
              type="number" 
              value={formData.initialSickLeave}
              onChange={(e) => handleInputChange("initialSickLeave", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Default: 10 days per year</p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea 
            placeholder="Add any additional information about the employee..." 
            className="min-h-[100px]"
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button type="submit" className="w-48" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Add Employee
            </>
          )}
        </Button>
      </div>
    </form>
  );
}