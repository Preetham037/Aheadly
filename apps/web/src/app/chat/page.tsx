import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AIChat() {
  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto flex flex-col space-y-6">
      <h1 className="text-3xl font-bold">Aheadly AI Assistant</h1>
      
      <Card className="flex-1 flex flex-col min-h-[500px]">
        <CardHeader>
          <CardTitle>Chat with Gemini 2.5 Flash</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-end space-y-4">
          <div className="bg-muted p-4 rounded-lg self-start max-w-[80%]">
            Hello! I can help you plan your week or extract tasks from your emails. What should we do next?
          </div>
          <div className="bg-blue-600 text-white p-4 rounded-lg self-end max-w-[80%]">
            I have an Operating Systems assignment next Tuesday.
          </div>
          <div className="bg-muted p-4 rounded-lg self-start max-w-[80%]">
            Got it. I've extracted: <br />
            <strong>Task:</strong> Operating Systems assignment<br />
            <strong>Deadline:</strong> Next Tuesday<br />
            <strong>Priority:</strong> HIGH<br /><br />
            I suggest scheduling 4 hours this weekend for it. Should I add this to your calendar?
          </div>
        </CardContent>
        <div className="p-4 border-t flex gap-4">
          <input 
            type="text" 
            placeholder="Type your message..." 
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          />
          <Button>Send</Button>
        </div>
      </Card>
    </div>
  )
}
