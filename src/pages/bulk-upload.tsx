import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrainerFeedbackBulkUpload } from "@/components/trainer-feedback-bulk-upload";
import { FileSpreadsheet, Users, TrendingUp } from "lucide-react";

export default function BulkUploadPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <FileSpreadsheet className="h-6 w-6 text-white" />
          </div>
          Bulk Upload Center
        </h1>
        <p className="text-muted-foreground mt-2">
          Upload multiple files at once to create trainer reviews, performance reports, and more
        </p>
      </div>

      <Tabs defaultValue="trainer-reviews" className="space-y-6">
        <TabsList className="grid grid-cols-1 md:grid-cols-3 h-auto">
          <TabsTrigger value="trainer-reviews" className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950/30">
            <Users className="h-4 w-4 mr-2" />
            Trainer Performance Reviews
          </TabsTrigger>
          <TabsTrigger value="metrics" disabled className="opacity-50">
            <TrendingUp className="h-4 w-4 mr-2" />
            Metrics Reports (Coming Soon)
          </TabsTrigger>
          <TabsTrigger value="other" disabled className="opacity-50">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Other Data (Coming Soon)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trainer-reviews" className="space-y-6">
          <TrainerFeedbackBulkUpload />

          {/* Additional Information Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">What gets created?</CardTitle>
                <CardDescription>Understanding the upload process</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>Each uploaded Excel/CSV file creates:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>One performance review ticket</li>
                  <li>Tagged with "performance-review" and "bulk-upload"</li>
                  <li>Assigned to Training & Development department</li>
                  <li>Viewable in the Tickets tab</li>
                  <li>Searchable and filterable like regular tickets</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Expected File Format</CardTitle>
                <CardDescription>What your files should contain</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>Files should include (similar to sample format):</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Trainer name and review period</li>
                  <li>Performance metrics (attendance, classes taught, etc.)</li>
                  <li>Client feedback summary</li>
                  <li>Internal feedback and assessment</li>
                  <li>Focus points and goals</li>
                  <li>Any additional notes or achievements</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
