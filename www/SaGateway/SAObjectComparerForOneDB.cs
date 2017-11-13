using System.Xml.Linq;
using ANBR.SemanticArchive.SDK.ObjectModel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace www.SaGateway
{
    class SAObjectComparerForOneDB : IEqualityComparer<ISaObject>
    {
        public bool Equals(ISaObject left, ISaObject right)
        {
            return left.Id == right.Id;
        }

        public int GetHashCode(ISaObject obj)
        {
            return obj.Id;
        }
    }
}