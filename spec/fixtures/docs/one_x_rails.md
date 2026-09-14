### File Attachments

Send files to AI models using ActiveStorage:

```ruby
# Create a chat
chat_record = Chat.create!(model: '{{ site.models.anthropic_current }}')

# Send a single file - type automatically detected
chat_record.ask("What's in this file?", with: "app/assets/images/diagram.png")

# Send multiple files of different types - all automatically detected
chat_record.ask("What are in these files?", with: [
  "app/assets/documents/report.pdf",
  "app/assets/images/chart.jpg",
  "app/assets/text/notes.txt",
  "app/assets/audio/recording.mp3"
])

# Works with file uploads from forms
chat_record.ask("Analyze this file", with: params[:uploaded_file])

# Works with existing ActiveStorage attachments
chat_record.ask("What's in this document?", with: user.profile_document) # has_one_attached
chat_record.ask("Compare these documents", with: project.documents)      # has_many_attached
```

File types are automatically detected from extensions or MIME types.
