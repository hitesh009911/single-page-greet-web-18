import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock, Star, ArrowLeft, Calendar, Edit, Trash2, User, TestTube, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";

interface OperatingHours {
  open: string;
  close: string;
}

interface DiagnosticCenter {
  _id: string;
  name: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone: string;
  email: string;
  operatingHours: {
    monday: OperatingHours;
    tuesday: OperatingHours;
    wednesday: OperatingHours;
    thursday: OperatingHours;
    friday: OperatingHours;
    saturday: OperatingHours;
    sunday: OperatingHours;
  };
  services?: string[];
  isActive: boolean;
  rating?: number;
  totalReviews?: number;
  adminId?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface Appointment {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  testId: {
    _id: string;
    name: string;
    category: string;
    price: number;
    duration: number;
  };
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  totalAmount: number;
  notes?: string;
  cancellationReason?: string;
}

const CenterDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [center, setCenter] = useState<DiagnosticCenter | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [cancellationReason, setCancellationReason] = useState<string>("");

  useEffect(() => {
    if (id) {
      fetchCenterDetails(id);
      fetchCenterAppointments(id);
    }
  }, [id]);

  const fetchCenterDetails = async (centerId: string) => {
    try {
      const response = await fetch(`/api/diagnostic-centers/${centerId}`);
      if (response.ok) {
        const data = await response.json();
        setCenter(data.center);
      } else {
        setError("Failed to fetch center details");
      }
    } catch (error) {
      console.error('Error fetching center details:', error);
      setError("Failed to fetch center details");
    } finally {
      setLoading(false);
    }
  };

  const fetchCenterAppointments = async (centerId: string) => {
    try {
      setAppointmentsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/appointments/center/${centerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const handleUpdateAppointment = async () => {
    if (!editingAppointment) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/appointments/${editingAppointment._id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          notes: notes,
          cancellationReason: newStatus === 'cancelled' ? cancellationReason : undefined
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Appointment updated successfully"
        });
        fetchCenterAppointments(id!);
        setEditingAppointment(null);
        setNewStatus("");
        setNotes("");
        setCancellationReason("");
      } else {
        throw new Error('Failed to update appointment');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update appointment",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'cancelled',
          cancellationReason: 'Cancelled by admin'
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Appointment cancelled successfully"
        });
        fetchCenterAppointments(id!);
      } else {
        throw new Error('Failed to cancel appointment');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setNewStatus(appointment.status);
    setNotes(appointment.notes || "");
    setCancellationReason(appointment.cancellationReason || "");
  };

  const formatOperatingHours = (day: string, hours: OperatingHours) => {
    if (!hours.open || !hours.close) return "Closed";
    return `${hours.open} - ${hours.close}`;
  };

  const getDaysArray = () => [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !center) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <BackButton />
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {error || "Center not found"}
            </p>
            <Link to="/centers">
              <Button className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Centers
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <BackButton />
        
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">{center.name}</h1>
            <Badge variant={center.isActive ? "default" : "secondary"}>
              {center.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          
          {center.description && (
            <p className="text-muted-foreground mb-4">{center.description}</p>
          )}
          
          {center.rating !== undefined && (
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-lg font-medium">{center.rating.toFixed(1)} / 5</span>
              <span className="text-muted-foreground">({center.totalReviews} reviews)</span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-muted-foreground">
                    {center.address.street}<br />
                    {center.address.city}, {center.address.state} - {center.address.zipCode}<br />
                    {center.address.country}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-muted-foreground">{center.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">{center.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Operating Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getDaysArray().map(({ key, label }) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground">
                      {formatOperatingHours(key, center.operatingHours[key as keyof typeof center.operatingHours])}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          {center.services && center.services.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Services Offered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {center.services.map((service, index) => (
                    <Badge key={index} variant="secondary">
                      {service}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Information */}
          {center.adminId && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Center Administrator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{center.adminId.name}</p>
                    <p className="text-muted-foreground">{center.adminId.email}</p>
                    <p className="text-muted-foreground">{center.adminId.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Appointments */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointmentsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : appointments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No appointments found</p>
              ) : (
                <div className="space-y-4">
                  {appointments.slice(0, 5).map((appointment) => (
                    <div key={appointment._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{appointment.patientId.name}</span>
                          <Badge variant={appointment.status === 'confirmed' ? 'default' : 
                                          appointment.status === 'completed' ? 'secondary' : 
                                          appointment.status === 'cancelled' ? 'destructive' : 'outline'}>
                            {appointment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <TestTube className="h-3 w-3" />
                            {appointment.testId.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                          </div>
                          <div>₹{appointment.totalAmount}</div>
                        </div>
                        {appointment.notes && (
                          <p className="text-xs text-muted-foreground mt-1">Notes: {appointment.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(appointment)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Appointment</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Status</label>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Notes</label>
                                <Textarea
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  placeholder="Add notes..."
                                />
                              </div>
                              {newStatus === 'cancelled' && (
                                <div>
                                  <label className="text-sm font-medium">Cancellation Reason</label>
                                  <Textarea
                                    value={cancellationReason}
                                    onChange={(e) => setCancellationReason(e.target.value)}
                                    placeholder="Reason for cancellation..."
                                  />
                                </div>
                              )}
                              <Button onClick={handleUpdateAppointment} className="w-full">
                                Update Appointment
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteAppointment(appointment._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Link to="/appointments/book" className="flex-1">
            <Button className="w-full">
              <Calendar className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
          </Link>
          <Link to="/centers" className="flex-1">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Centers
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CenterDetails;