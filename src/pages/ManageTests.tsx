import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";
import { TestTube, Edit, Trash2, Loader2, Search, Clock, X, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DiagnosticTest {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  preparationInstructions: string;
  requirements: string[];
  scheduledTimes: string[];
}

interface TestFormData {
  name: string;
  description: string;
  category: string;
  price: string;
  duration: string;
  preparationInstructions: string;
  requirements: string[];
  scheduledTimes: string[];
}

const ManageTests = () => {
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTest, setEditingTest] = useState<DiagnosticTest | null>(null);
  const [editFormData, setEditFormData] = useState<TestFormData>({
    name: '',
    description: '',
    category: '',
    price: '',
    duration: '',
    preparationInstructions: '',
    requirements: [],
    scheduledTimes: []
  });
  const [newRequirement, setNewRequirement] = useState('');
  const [newScheduledTime, setNewScheduledTime] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const categories = [
    { value: 'blood_test', label: 'Blood Test' },
    { value: 'imaging', label: 'Imaging' },
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'pathology', label: 'Pathology' },
    { value: 'radiology', label: 'Radiology' },
    { value: 'other', label: 'Other' }
  ];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
  ];

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'exists' : 'missing');
      
      const response = await fetch('/api/diagnostic-tests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('API Response:', result);
        
        // Handle different possible response formats
        let testsData = [];
        if (result.data && Array.isArray(result.data)) {
          testsData = result.data;
        } else if (result.tests && Array.isArray(result.tests)) {
          testsData = result.tests;
        } else if (Array.isArray(result)) {
          testsData = result;
        }
        
        console.log('Tests data:', testsData);
        setTests(testsData);
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        toast({
          title: "Error",
          description: errorData.message || "Failed to load tests",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Fetch tests error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = Array.isArray(tests) ? tests.filter(test =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const handleEditClick = (test: DiagnosticTest) => {
    setEditingTest(test);
    setEditFormData({
      name: test.name,
      description: test.description,
      category: test.category,
      price: test.price.toString(),
      duration: test.duration.toString(),
      preparationInstructions: test.preparationInstructions,
      requirements: test.requirements ? [...test.requirements] : [],
      scheduledTimes: test.scheduledTimes ? [...test.scheduledTimes] : []
    });
    setIsEditDialogOpen(true);
  };

  const handleInputChange = (field: keyof TestFormData, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setEditFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const addScheduledTime = () => {
    if (newScheduledTime.trim()) {
      if (editFormData.scheduledTimes.includes(newScheduledTime)) {
        toast({
          title: "Duplicate Time",
          description: "This time slot has already been added",
          variant: "destructive",
        });
        return;
      }
      
      setEditFormData(prev => ({
        ...prev,
        scheduledTimes: [...prev.scheduledTimes, newScheduledTime].sort()
      }));
      setNewScheduledTime('');
    }
  };

  const removeScheduledTime = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      scheduledTimes: prev.scheduledTimes.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateTest = async () => {
    if (!editingTest || !editFormData.name || !editFormData.category || !editFormData.price || !editFormData.duration) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/diagnostic-center-admin/tests/${editingTest._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editFormData.name,
          description: editFormData.description,
          category: editFormData.category,
          price: parseFloat(editFormData.price),
          duration: parseInt(editFormData.duration),
          preparationInstructions: editFormData.preparationInstructions,
          requirements: editFormData.requirements,
          scheduledTimes: editFormData.scheduledTimes
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Test updated successfully",
        });
        setIsEditDialogOpen(false);
        setEditingTest(null);
        fetchTests();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to update test",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Update test error:', error);
      toast({
        title: "Error",
        description: "An error occurred while updating the test",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTest = async (testId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/diagnostic-center-admin/tests/${testId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Test deleted successfully",
        });
        fetchTests();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete test",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Delete test error:', error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the test",
        variant: "destructive",
      });
    }
  };

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
                <TestTube className="h-6 w-6" />
                Manage Tests
              </CardTitle>
              <CardDescription>
                Update or delete existing diagnostic tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="search">Search Tests</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="search"
                      placeholder="Search by name or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading tests...</p>
                </div>
              ) : filteredTests.length === 0 ? (
                <div className="text-center p-8">
                  <TestTube className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No tests found matching your search.' : 'No tests available.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredTests.map((test) => (
                    <Card key={test._id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{test.name}</h3>
                              <span className="px-2 py-1 bg-muted text-sm rounded">
                                {categories.find(cat => cat.value === test.category)?.label || test.category}
                              </span>
                            </div>
                            <p className="text-muted-foreground mb-2">{test.description}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Price: </span>
                                ₹{test.price}
                              </div>
                              <div>
                                <span className="font-medium">Duration: </span>
                                {test.duration} minutes
                              </div>
                              <div>
                                <span className="font-medium">Requirements: </span>
                                {test.requirements?.length || 0}
                              </div>
                              <div>
                                <span className="font-medium">Time Slots: </span>
                                {test.scheduledTimes?.length || 0}
                              </div>
                            </div>
                            {test.scheduledTimes && test.scheduledTimes.length > 0 && (
                              <div className="mt-3">
                                <span className="text-sm font-medium">Available Times: </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {test.scheduledTimes.map((time, index) => (
                                    <span key={index} className="px-2 py-1 bg-muted text-xs rounded flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {time}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Dialog open={isEditDialogOpen && editingTest?._id === test._id} onOpenChange={(open) => {
                              setIsEditDialogOpen(open);
                              if (!open) {
                                setEditingTest(null);
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditClick(test)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Edit Test</DialogTitle>
                                  <DialogDescription>
                                    Update the test information below.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  {/* Test Name */}
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-name">Test Name *</Label>
                                    <Input
                                      id="edit-name"
                                      value={editFormData.name}
                                      onChange={(e) => handleInputChange('name', e.target.value)}
                                    />
                                  </div>

                                  {/* Category */}
                                  <div className="space-y-2">
                                    <Label>Category *</Label>
                                    <Select value={editFormData.category} onValueChange={(value) => handleInputChange('category', value)}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {categories.map((category) => (
                                          <SelectItem key={category.value} value={category.value}>
                                            {category.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Price and Duration */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-price">Price (₹) *</Label>
                                      <Input
                                        id="edit-price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={editFormData.price}
                                        onChange={(e) => handleInputChange('price', e.target.value)}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-duration">Duration (minutes) *</Label>
                                      <Input
                                        id="edit-duration"
                                        type="number"
                                        min="1"
                                        value={editFormData.duration}
                                        onChange={(e) => handleInputChange('duration', e.target.value)}
                                      />
                                    </div>
                                  </div>

                                  {/* Description */}
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Textarea
                                      id="edit-description"
                                      value={editFormData.description}
                                      onChange={(e) => handleInputChange('description', e.target.value)}
                                      rows={3}
                                    />
                                  </div>

                                  {/* Preparation Instructions */}
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-prep">Preparation Instructions</Label>
                                    <Textarea
                                      id="edit-prep"
                                      value={editFormData.preparationInstructions}
                                      onChange={(e) => handleInputChange('preparationInstructions', e.target.value)}
                                      rows={3}
                                    />
                                  </div>

                                  {/* Requirements */}
                                  <div className="space-y-2">
                                    <Label>Requirements</Label>
                                    <div className="flex gap-2">
                                      <Input
                                        value={newRequirement}
                                        onChange={(e) => setNewRequirement(e.target.value)}
                                        placeholder="Add a requirement"
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addRequirement();
                                          }
                                        }}
                                      />
                                      <Button type="button" onClick={addRequirement} variant="outline" size="sm">
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    {editFormData.requirements.length > 0 && (
                                      <div className="space-y-2 mt-3">
                                        {editFormData.requirements.map((req, index) => (
                                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                                            <span className="text-sm">{req}</span>
                                            <Button
                                              type="button"
                                              onClick={() => removeRequirement(index)}
                                              variant="ghost"
                                              size="sm"
                                              className="text-destructive hover:text-destructive"
                                            >
                                              Remove
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Scheduled Times */}
                                  <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                      <Clock className="h-4 w-4" />
                                      Available Time Slots
                                    </Label>
                                    <div className="flex gap-2">
                                      <Select 
                                        value={newScheduledTime} 
                                        onValueChange={(value) => setNewScheduledTime(value)}
                                      >
                                        <SelectTrigger className="flex-1">
                                          <SelectValue placeholder="Select time slot" />
                                        </SelectTrigger>
                                         <SelectContent className="bg-background border shadow-md z-50">
                                          {timeSlots
                                            .filter(slot => !editFormData.scheduledTimes.includes(slot))
                                            .map((slot) => (
                                            <SelectItem key={slot} value={slot}>
                                              {slot}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Button 
                                        type="button" 
                                        onClick={addScheduledTime} 
                                        variant="outline" 
                                        size="sm"
                                        disabled={!newScheduledTime}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    {editFormData.scheduledTimes.length > 0 && (
                                      <div className="space-y-2 mt-3">
                                        <p className="text-sm text-muted-foreground">
                                          {editFormData.scheduledTimes.length} time slot(s) added
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                          {editFormData.scheduledTimes.map((time, index) => (
                                            <div key={index} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                                              <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {time}
                                              </span>
                                              <Button
                                                type="button"
                                                onClick={() => removeScheduledTime(index)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                              >
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleUpdateTest}>
                                    Update Test
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Test</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{test.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteTest(test._id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

export default ManageTests;
