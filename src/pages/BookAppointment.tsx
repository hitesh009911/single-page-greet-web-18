import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";

interface DiagnosticCenter {
  _id: string;
  name: string;
  address: {
    street: string;
    city: string;
  };
}

interface DiagnosticTest {
  _id: string;
  name: string;
  price: number;
  center: string;
  scheduledTimes?: string[];
}

const BookAppointment = () => {
  const [centers, setCenters] = useState<DiagnosticCenter[]>([]);
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [selectedCenter, setSelectedCenter] = useState("");
  const [selectedTest, setSelectedTest] = useState("");
  const [date, setDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get available time slots from selected test
  const getAvailableTimeSlots = () => {
    const selectedTestData = tests.find(test => test._id === selectedTest);
    // If no scheduled times are available, provide default time slots
    return selectedTestData?.scheduledTimes && selectedTestData.scheduledTimes.length > 0 
      ? selectedTestData.scheduledTimes 
      : [
          "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
          "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
          "16:00", "16:30", "17:00", "17:30"
        ];
  };

  useEffect(() => {
    fetchCenters();
  }, []);

  useEffect(() => {
    if (selectedCenter) {
      fetchTestsByCenter(selectedCenter);
    } else {
      setTests([]);
      setSelectedTest("");
      setTime("");
    }
  }, [selectedCenter]);

  useEffect(() => {
    // Reset time when test changes
    setTime("");
  }, [selectedTest]);

  const fetchCenters = async () => {
    try {
      const response = await fetch('/api/diagnostic-centers');
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched tests:", data);
        setCenters(data.centers || data); // fallback support
      }
    } catch (error) {
      console.error('Error fetching centers:', error);
    }
  };

  const fetchTestsByCenter = async (centerId: string) => {
    try {
      const response = await fetch(`/api/diagnostic-tests/center/${centerId}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched tests:", data); // Debug line
        setTests(data.tests || data);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCenter || !selectedTest || !date || !time) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      // Combine date and time for proper datetime handling
      const appointmentDateTime = new Date(date);
      const [hours, minutes] = time.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          center: selectedCenter,
          test: selectedTest,
          appointmentDate: format(appointmentDateTime, "yyyy-MM-dd"),
          appointmentTime: time,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Appointment Booked",
          description: "Your appointment has been successfully booked!",
        });
        navigate('/dashboard');
      } else {
        toast({
          title: "Booking Failed",
          description: data.message || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <BackButton />
          <Card>
            <CardHeader>
              <CardTitle>Book Appointment</CardTitle>
              <CardDescription>Schedule your diagnostic test appointment</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="center">Diagnostic Center</Label>
                  <Select onValueChange={setSelectedCenter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a diagnostic center" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-md z-50">
                      {centers.map((center) => (
                        <SelectItem key={center._id} value={center._id}>
                          {center.name} - {center.address?.street}, {center.address?.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCenter && (
                  <div className="space-y-2">
                    <Label htmlFor="test">Diagnostic Test</Label>
                    <Select value={selectedTest} onValueChange={setSelectedTest}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a diagnostic test" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-md z-50">
                        {tests.map((test) => (
                          <SelectItem key={test._id} value={test._id}>
                            {test.name} - ₹{test.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Appointment Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background border shadow-md z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Appointment Time</Label>
                  {selectedTest ? (
                    getAvailableTimeSlots().length > 0 ? (
                      <Select value={time} onValueChange={setTime}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select appointment time" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-md z-50">
                          {getAvailableTimeSlots().map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select disabled>
                        <SelectTrigger>
                          <SelectValue placeholder="No scheduled times available for this test" />
                        </SelectTrigger>
                      </Select>
                    )
                  ) : (
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Please select a test first" />
                      </SelectTrigger>
                    </Select>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Booking..." : "Book Appointment"}
                </Button>
              </CardContent>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;

