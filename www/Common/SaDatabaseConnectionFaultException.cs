using System;

namespace www.Common
{
    public class SaDatabaseConnectionFaultException : ApplicationException
    {
        public SaDatabaseConnectionFaultException(string message)
            : base(message)
        {
        }
    }
}
