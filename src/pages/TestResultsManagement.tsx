import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, File, User, Calendar, TestTube, Search, FileCheck, AlertCircle } from "lucide-react";
import BackButton from "@/components/BackButton";
import { FileUpload } from "@/components/FileUpload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface DiagnosticTest {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  preparationInstructions?: string;
  isActive: boolean;
  requirements?: string[];
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
  };
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  results?: {
    reportUrl?: string;
    summary?: string;
    uploadedAt?: string;
  };
}

interface UploadFormData {
  appointmentId: string;
  summary: string;
  file: File | null;
}

const TestResultsManagement = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [diagnosticTests, setDiagnosticTests] = useState<DiagnosticTest[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState<UploadFormData>({
    appointmentId: '',
    summary: '',
    file: null
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAppointments();
    fetchDiagnosticTests();
  }, []);

  useEffect(() => {
    const filtered = appointments.filter(appointment =>
      appointment.patientId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patientId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.testId.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAppointments(filtered);
  }, [appointments, searchTerm]);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/diagnostic-center-admin/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('API response:', result); // Debug log
        
        // The API returns data in a nested structure: { success: true, data: { appointments: [...] } }
        let appointmentsData = [];
        
        if (result.success && result.data && result.data.appointments) {
          appointmentsData = result.data.appointments;
        } else if (result.appointments) {
          appointmentsData = result.appointments;
        } else if (Array.isArray(result.data)) {
          appointmentsData = result.data;
        } else if (Array.isArray(result)) {
          appointmentsData = result;
        }
        
        // Ensure appointmentsData is an array
        const appointmentsArray = Array.isArray(appointmentsData) ? appointmentsData : [];
        console.log('All appointments:', appointmentsArray); // Debug log
        console.log('Appointment statuses:', appointmentsArray.map((apt: Appointment) => apt.status)); // Debug log
        
        // Show all appointments (not just completed ones) so we can see what's available
        // Results can be uploaded for any appointment that isn't cancelled
        const eligibleAppointments = appointmentsArray.filter(
          (apt: Appointment) => apt.status !== 'cancelled' && apt.status !== 'no_show'
        );
        console.log('Eligible appointments:', eligibleAppointments); // Debug log
        setAppointments(eligibleAppointments);
        setFilteredAppointments(eligibleAppointments);
      } else {
        toast({
          title: "Error",
          description: "Failed to load appointments",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Fetch appointments error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch appointments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDiagnosticTests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/diagnostic-center-admin/tests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Diagnostic tests response:', result);
        
        let testsData = [];
        if (result.success && result.data) {
          testsData = result.data;
        } else if (Array.isArray(result)) {
          testsData = result;
        }
        
        setDiagnosticTests(testsData);
      } else {
        console.error('Failed to fetch diagnostic tests');
      }
    } catch (error) {
      console.error('Error fetching diagnostic tests:', error);
    }
  };

  const handleUploadClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setUploadForm({
      appointmentId: appointment._id,
      summary: appointment.results?.summary || '',
      file: null
    });
    setIsUploadDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadForm(prev => ({ ...prev, file }));
  };

  const handleFileUpload = (file: File) => {
    setUploadForm(prev => ({ ...prev, file }));
  };

  const handleUploadResults = async () => {
    if (!uploadForm.file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('summary', uploadForm.summary);
      formData.append('appointmentId', uploadForm.appointmentId);

      const token = localStorage.getItem('token');
      console.log('Uploading with token:', token ? 'Token exists' : 'No token');
      console.log('Selected appointment:', selectedAppointment);
      console.log('Upload form data:', {
        appointmentId: uploadForm.appointmentId,
        summary: uploadForm.summary,
        fileName: uploadForm.file?.name
      });
      
      // Debug: decode token to see user info
      if (token) {
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          console.log('Token payload:', tokenPayload);
        } catch (e) {
          console.log('Could not decode token');
        }
      }
      
      const response = await fetch('/api/diagnostic-center-admin/upload-results', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Test results uploaded successfully",
        });
        setIsUploadDialogOpen(false);
        setSelectedAppointment(null);
        setUploadForm({ appointmentId: '', summary: '', file: null });
        fetchAppointments();
      } else {
        const errorData = await response.json();
        console.log('Upload failed with status:', response.status);
        console.log('Error response:', errorData);
        toast({
          title: "Error",
          description: errorData.message || "Failed to upload results",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "An error occurred while uploading results",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'default';
      case 'confirmed': return 'secondary';
      default: return 'outline';
    }
  };

  const hasResults = (appointment: Appointment) => {
    return appointment.results?.reportUrl || appointment.results?.summary;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="max-w-6xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-6 w-6" />
                Test Results Management
              </CardTitle>
              <CardDescription>
                Upload and manage test results for patient appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="search">Search Appointments</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="search"
                      placeholder="Search by patient name, email, or test name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="text-center p-8">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No appointments found matching your search.' : 'No appointments available for results upload.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredAppointments.map((appointment) => (
                    <Card key={appointment._id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <h3 className="text-lg font-semibold">{appointment.patientId.name}</h3>
                              <Badge variant={getStatusBadgeVariant(appointment.status)}>
                                {appointment.status.toUpperCase()}
                              </Badge>
                              {hasResults(appointment) && (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  Results Uploaded
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <TestTube className="h-4 w-4" />
                                <span>{appointment.testId.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                                </span>
                              </div>
                              <div>
                                <span>Email: {appointment.patientId.email}</span>
                              </div>
                            </div>
                            {hasResults(appointment) && (
                              <div className="mt-3 p-3 bg-muted rounded-lg">
                                <h4 className="font-medium text-sm mb-1">Results Summary:</h4>
                                <p className="text-sm">{appointment.results?.summary || 'No summary provided'}</p>
                                {appointment.results?.uploadedAt && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Uploaded: {new Date(appointment.results.uploadedAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Dialog open={isUploadDialogOpen && selectedAppointment?._id === appointment._id} onOpenChange={(open) => {
                              setIsUploadDialogOpen(open);
                              if (!open) {
                                setSelectedAppointment(null);
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant={hasResults(appointment) ? "outline" : "default"}
                                  size="sm"
                                  onClick={() => handleUploadClick(appointment)}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  {hasResults(appointment) ? 'Update Results' : 'Upload Results'}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>
                                    {hasResults(appointment) ? 'Update' : 'Upload'} Test Results
                                  </DialogTitle>
                                  <DialogDescription>
                                    {hasResults(appointment) ? 'Update' : 'Upload'} results for {selectedAppointment?.patientId.name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="file">Results File *</Label>
                                    <FileUpload
                                      onFileSelect={handleFileUpload}
                                      selectedFile={uploadForm.file}
                                      acceptedTypes=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                      maxSize={10 * 1024 * 1024} // 10MB
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="summary">Summary (Optional)</Label>
                                    <Textarea
                                      id="summary"
                                      placeholder="Enter a brief summary of the results..."
                                      value={uploadForm.summary}
                                      onChange={(e) => setUploadForm(prev => ({ ...prev, summary: e.target.value }))}
                                      rows={3}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    onClick={handleUploadResults}
                                    disabled={uploading || !uploadForm.file}
                                    className="w-full"
                                  >
                                    {uploading ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        {hasResults(appointment) ? 'Update Results' : 'Upload Results'}
                                      </>
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestResultsManagement;