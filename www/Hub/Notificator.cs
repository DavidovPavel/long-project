using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using ANBR.Monitoring.Implementation;

namespace www.Hub
{
    public class Notificator : System.Timers.Timer
    {
        int? _mainObjectID;
        public int? MainObjectID
        {
            get { return _mainObjectID; }
            set { _mainObjectID = value; }
        }

        ANBR.SemanticArchive.SDK.IDataBase _dataBase;
        public ANBR.SemanticArchive.SDK.IDataBase DataBase
        {
            get { return _dataBase; }
            set { _dataBase = value; }
        }

        string _connectionID;
        private ANBR.Monitoring.IGateway _mbf;
        private ContextData _context;

        public ANBR.Monitoring.IGateway Mbf
        {
            get { return _mbf; }
            set { _mbf = value; }
        }

        public string ConnectionID
        {
            get { return _connectionID; }
            set { _connectionID = value; }
        }

        public ContextData Context
        {
            get { return _context; }
        }

        private Notificator()
        {
        }

        public Notificator(ANBR.SemanticArchive.SDK.IDataBase dataBase, ANBR.Monitoring.IGateway mbf, string connectionID, ContextData context)
        {
            _dataBase = dataBase;
            _connectionID = connectionID;
            _mbf = mbf;
            _context = context;
        }

        internal void SetMainObject(int? mainObjectID)
        {
            _mainObjectID = mainObjectID;
        }
    }
}
