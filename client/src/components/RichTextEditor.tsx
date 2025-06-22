import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import { 
  Bold, 
  Italic, 
  Underline, 
  Link2, 
  List, 
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  Eye,
  Smartphone,
  Monitor,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  title: string;
}

export default function RichTextEditor({ content, onChange, title }: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const addLink = () => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setIsLinkDialogOpen(false);
    }
  };

  const removeLink = () => {
    if (editor) {
      editor.chain().focus().unsetLink().run();
    }
  };

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    children, 
    title 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    children: React.ReactNode; 
    title: string;
  }) => (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      title={title}
      className="h-8 w-8 p-0"
    >
      {children}
    </Button>
  );

  const convertToMarkdown = (html: string): string => {
    // Basic HTML to Markdown conversion
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/g, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/g, '*$1*')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
      .replace(/<ul[^>]*>(.*?)<\/ul>/gs, (match, content) => {
        const items = content.replace(/<li[^>]*>(.*?)<\/li>/g, '- $1\n');
        return items + '\n';
      })
      .replace(/<ol[^>]*>(.*?)<\/ol>/gs, (match, content) => {
        let counter = 1;
        const items = content.replace(/<li[^>]*>(.*?)<\/li>/g, () => `${counter++}. $1\n`);
        return items + '\n';
      })
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gs, '> $1\n\n')
      .replace(/<code[^>]*>(.*?)<\/code>/g, '`$1`')
      .replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  };

  const PreviewContent = ({ platform }: { platform: 'mobile' | 'desktop' | 'email' }) => {
    const htmlContent = editor.getHTML();
    const markdownContent = convertToMarkdown(htmlContent);

    const platformStyles = {
      mobile: 'max-w-sm mx-auto bg-gray-900 rounded-3xl p-4 shadow-2xl',
      desktop: 'max-w-4xl mx-auto bg-white rounded-lg shadow-lg border',
      email: 'max-w-2xl mx-auto bg-white border shadow-sm'
    };

    const contentStyles = {
      mobile: 'bg-white rounded-2xl p-4 text-sm font-sans',
      desktop: 'p-8 text-base font-sans',
      email: 'p-6 text-sm font-sans bg-gray-50'
    };

    return (
      <div className={platformStyles[platform]}>
        {platform === 'mobile' && (
          <div className="flex items-center justify-center mb-4">
            <div className="w-1/3 h-1 bg-gray-300 rounded-full"></div>
          </div>
        )}
        
        <div className={contentStyles[platform]}>
          <h1 className="text-lg font-bold mb-4 border-b pb-2">{title}</h1>
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
          
          {platform === 'email' && (
            <div className="mt-6 pt-4 border-t text-xs text-gray-500">
              <p>This email was sent from AI Newsletter Automation Hub</p>
              <p>Unsubscribe | Manage Preferences</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Newsletter Editor</span>
            <div className="flex items-center space-x-2">
              <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Newsletter Preview</DialogTitle>
                  </DialogHeader>
                  
                  <Tabs defaultValue="desktop" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="desktop" className="flex items-center space-x-2">
                        <Monitor className="w-4 h-4" />
                        <span>Desktop</span>
                      </TabsTrigger>
                      <TabsTrigger value="mobile" className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4" />
                        <span>Mobile</span>
                      </TabsTrigger>
                      <TabsTrigger value="email" className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="desktop" className="mt-6">
                      <PreviewContent platform="desktop" />
                    </TabsContent>
                    
                    <TabsContent value="mobile" className="mt-6">
                      <PreviewContent platform="mobile" />
                    </TabsContent>
                    
                    <TabsContent value="email" className="mt-6">
                      <PreviewContent platform="email" />
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Toolbar */}
          <div className="border border-gray-200 rounded-lg mb-4">
            <div className="flex items-center space-x-1 p-2 border-b border-gray-200">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </ToolbarButton>
              
              <div className="w-px h-6 bg-gray-300 mx-1" />
              
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                isActive={editor.isActive('heading', { level: 1 })}
                title="Heading 1"
              >
                H1
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive('heading', { level: 2 })}
                title="Heading 2"
              >
                H2
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                isActive={editor.isActive('heading', { level: 3 })}
                title="Heading 3"
              >
                H3
              </ToolbarButton>
              
              <div className="w-px h-6 bg-gray-300 mx-1" />
              
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                title="Quote"
              >
                <Quote className="h-4 w-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleCode().run()}
                isActive={editor.isActive('code')}
                title="Code"
              >
                <Code className="h-4 w-4" />
              </ToolbarButton>
              
              <div className="w-px h-6 bg-gray-300 mx-1" />
              
              <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant={editor.isActive('link') ? "default" : "ghost"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Add Link"
                  >
                    <Link2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Link</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="link-url">URL</Label>
                      <Input
                        id="link-url"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://example.com"
                        onKeyDown={(e) => e.key === 'Enter' && addLink()}
                      />
                    </div>
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={removeLink}>
                        Remove Link
                      </Button>
                      <Button onClick={addLink}>Add Link</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <div className="w-px h-6 bg-gray-300 mx-1" />
              
              <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </ToolbarButton>
            </div>
            
            {/* Editor Content */}
            <EditorContent 
              editor={editor} 
              className="prose prose-sm max-w-none p-4 min-h-[400px] focus:outline-none"
            />
          </div>
          
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>
              {editor.storage.characterCount?.characters() || 0} characters, {' '}
              {editor.getText().split(/\s+/).filter(word => word.length > 0).length} words
            </span>
            <span>Use Ctrl+B for bold, Ctrl+I for italic</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}