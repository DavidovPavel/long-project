using System;
using System.Collections.Generic;
using System.Text;

namespace www.SaGateway
{
    public class SendMessage
    {
        public string Subject { get; set; }
        public string Text { get; set; }
        public string Email { get; set; }
        public string[] Attachments { get; set; }

        public SendMessage()
        {
            Attachments = new string[0];
        }
    }
}
